import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const {
  TIDB_HOST,
  TIDB_PORT = 4000,
  TIDB_USER,
  TIDB_PASSWORD,
  TIDB_DATABASE = 'AVS_Crackers',
} = process.env;

// Serverless-friendly global connection pool caching
let pool = global._tidbPool;

if (!pool) {
  pool = mysql.createPool({
    host: TIDB_HOST,
    port: Number(TIDB_PORT),
    user: TIDB_USER,
    password: TIDB_PASSWORD,
    database: TIDB_DATABASE,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Sends TCP keep-alive packets every 10s to prevent connection sleep/drop
  });

  global._tidbPool = pool;
}

// Lightweight ping to prevent TiDB connection sleep
export const pingTiDB = async () => {
  try {
    const [result] = await pool.query('SELECT 1 AS alive');
    return result[0]?.alive === 1;
  } catch (err) {
    console.error('[TiDB Ping Error]', err.message);
    return false;
  }
};

// Initialize TiDB database and necessary tables if they do not exist
let isInitialized = false;

export const initDatabase = async () => {
  if (isInitialized) return;

  try {
    // 1. Connect without specific database to ensure database creation
    const rootConn = await mysql.createConnection({
      host: TIDB_HOST,
      port: Number(TIDB_PORT),
      user: TIDB_USER,
      password: TIDB_PASSWORD,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${TIDB_DATABASE}\`;`);
    await rootConn.end();

    // 2. Ensure schema in targeted database
    await pool.query(`
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
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_details (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        gstin VARCHAR(30) NULL,
        mobile VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        signature_url TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_account_details (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        bank_name VARCHAR(150) NOT NULL,
        account_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        branch_location VARCHAR(150) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_numbering_settings (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'REC',
        current_sequence INT UNSIGNED NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(100) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_name (name),
        INDEX idx_category_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NULL,
        hsn_code VARCHAR(50) NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
        selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_product_name (name),
        INDEX idx_product_category (category),
        INDEX idx_product_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        invoice_date DATE NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_mobile VARCHAR(20) NOT NULL,
        billing_address TEXT NOT NULL,
        delivery_address TEXT NULL,
        subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        total_items_count INT UNSIGNED NOT NULL DEFAULT 1,
        total_qty INT UNSIGNED NOT NULL DEFAULT 1,
        amount_in_words TEXT NULL,
        pdf_url TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_invoice_number (invoice_number),
        INDEX idx_invoice_date (invoice_date),
        INDEX idx_customer_mobile (customer_mobile)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NULL,
        product_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
        rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        qty INT UNSIGNED NOT NULL DEFAULT 1,
        total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item_invoice_id (invoice_id),
        INDEX idx_item_product_name (product_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isInitialized = true;
    console.log(`[TiDB] Connected & initialized database tables: ${TIDB_DATABASE}`);
  } catch (err) {
    console.error('[TiDB] Database initialization error:', err.message);
  }
};

export { pool };
export default pool;
