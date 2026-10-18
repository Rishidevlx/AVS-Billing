import pool from '../config/db.js';

export const findByEmailOrUsername = async (identifier) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0] || null;
};

export const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, uuid, username, email, full_name, role, is_active FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

export const findUserWithPasswordById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

export const updatePassword = async (id, passwordHash) => {
  await pool.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  );
};

export const updateLoginSuccess = async (id) => {
  await pool.execute(
    `UPDATE users 
     SET failed_login_attempts = 0, 
         lock_until = NULL, 
         last_login_at = NOW() 
     WHERE id = ?`,
    [id]
  );
};

export const incrementFailedAttempts = async (id, maxAttempts = 5, lockMinutes = 15) => {
  await pool.execute(
    `UPDATE users 
     SET failed_login_attempts = failed_login_attempts + 1,
         lock_until = CASE 
           WHEN failed_login_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
           ELSE lock_until 
         END
     WHERE id = ?`,
    [maxAttempts, lockMinutes, id]
  );
};
