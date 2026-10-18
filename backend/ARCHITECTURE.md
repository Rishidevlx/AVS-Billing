# Rinvox Billing Software - Backend Architecture & Security Blueprint

## 1. Overview
This backend service is built using **Node.js (ES Modules / `type: "module"`)** and **Express.js**, integrated with **TiDB Cloud SQL** (distributed, MySQL-compatible cloud database) for high availability and transactional consistency.

---

## 2. Industry Standard Layered Architecture
We adopt the **Controller-Service-Repository** pattern to ensure strict separation of concerns, testability, and enterprise maintainability:

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # TiDB Cloud connection pool with SSL
│   │   └── env.js                  # Environment variable schema validation (Zod)
│   ├── controllers/
│   │   └── auth.controller.js      # Handles HTTP request/response & status codes
│   ├── services/
│   │   └── auth.service.js         # Core business logic (auth, tokens, lockout)
│   ├── repositories/
│   │   └── user.repository.js      # Direct TiDB SQL queries (parameterized)
│   ├── routes/
│   │   ├── index.js                # Master route aggregator (/api/v1)
│   │   └── auth.routes.js          # Authentication endpoints (/api/v1/auth)
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification & role guard
│   │   ├── rateLimiter.middleware.js# Brute-force protection for login
│   │   ├── validate.middleware.js  # Request schema validator (Zod)
│   │   └── errorHandler.middleware.js # Centralized enterprise error handler
│   ├── schemas/
│   │   └── auth.schema.js          # Zod validation schemas for login
│   ├── utils/
│   │   ├── jwt.js                  # Sign & verify Access/Refresh tokens
│   │   └── password.js             # bcrypt password hashing & verification
│   ├── app.js                      # Express middleware, CORS, Helmet config
│   └── server.js                   # Application bootstrap & DB healthcheck
├── .env.example                    # Environment variable template
├── package.json                    # "type": "module" enabled
└── ARCHITECTURE.md                 # Complete system blueprint
```

---

## 3. TiDB Cloud SQL Schema & Table Design

TiDB is 100% MySQL-protocol compatible. Below is the optimized SQL schema for users and audit logs:

```sql
CREATE DATABASE IF NOT EXISTS rinvox_billing;
USE rinvox_billing;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  lock_until DATETIME NULL DEFAULT NULL,
  last_login_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_status (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Login Audit Log Table
CREATE TABLE IF NOT EXISTS login_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  identifier VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) NULL,
  status ENUM('success', 'failed', 'locked') NOT NULL,
  failure_reason VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. TiDB Connection Configuration (`src/config/db.js`)
TiDB Cloud requires TLS/SSL connection with connection pooling:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export default pool;
```

---

## 5. Security & Login Flow Blueprint

### Step 1: Network & HTTP Hardening
- **Helmet**: Adds secure HTTP response headers (Content-Security-Policy, HSTS, X-Frame-Options).
- **CORS**: Whitelists only the frontend origin (e.g. `http://localhost:5173` in development, domain in production) with `credentials: true`.
- **JSON Payload Limit**: Limited to `10kb` to protect against payload flooding attacks.

### Step 2: Rate Limiting (Brute-Force Shield)
- Use `express-rate-limit` on the `/api/v1/auth/login` endpoint.
- Max 5 requests per 15-minute window per IP.
- Return HTTP 429 (`Too Many Requests`) if threshold exceeded.

### Step 3: Request Validation (Zod)
- Input must pass strict validation before any database query:
  - `identifier`: String, trimmed, min 3 chars (supports username or email).
  - `password`: String, min 6 chars, max 128 chars.

### Step 4: Parameterized SQL Query (SQL Injection Prevention)
- Queries in `user.repository.js` use `?` placeholders:
  ```javascript
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier, identifier]
  );
  ```

### Step 5: Account Lockout & Password Verification
- Verify if user is active and `lock_until` is not in the future.
- Use `bcrypt.compare(password, user.password_hash)`.
- If match fails:
  - Increment `failed_login_attempts`.
  - If attempts >= 5, set `lock_until = NOW() + INTERVAL 15 MINUTE`.
  - Record event in `login_audit_logs`.
- If match succeeds:
  - Reset `failed_login_attempts = 0` and `lock_until = NULL`.
  - Update `last_login_at = NOW()`.
  - Record success in `login_audit_logs`.

### Step 6: Enterprise Dual-Token Session Pattern
1. **Access Token (JWT)**:
   - Contains: `{ userId, uuid, role, username }`.
   - Lifespan: Short-lived (15 minutes).
   - Sent in JSON response to client (stored in memory).
2. **Refresh Token (JWT)**:
   - Lifespan: Long-lived (7 days).
   - Stored in a secure cookie:
     ```javascript
     res.cookie('refreshToken', token, {
       httpOnly: true, // Inaccessible to JavaScript (XSS safe)
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict', // CSRF protection
       maxAge: 7 * 24 * 60 * 60 * 1000,
     });
     ```
