import pool from '../config/db.js';

export const getAllCategories = async () => {
  const [rows] = await pool.execute(`
    SELECT 
      id, 
      name, 
      description, 
      is_active, 
      DATE_FORMAT(created_at, '%d %b %Y') AS createdAt,
      created_at
    FROM categories 
    WHERE is_active = TRUE 
    ORDER BY id DESC
  `);
  return rows;
};

export const getCategoryById = async (id) => {
  const [rows] = await pool.execute(`
    SELECT 
      id, 
      name, 
      description, 
      is_active, 
      DATE_FORMAT(created_at, '%d %b %Y') AS createdAt 
    FROM categories 
    WHERE id = ? AND is_active = TRUE
    LIMIT 1
  `, [id]);
  return rows[0] || null;
};

export const getCategoryByName = async (name, excludeId = null) => {
  if (excludeId) {
    const [rows] = await pool.execute(
      `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? AND is_active = TRUE LIMIT 1`,
      [name.trim(), excludeId]
    );
    return rows[0] || null;
  }
  const [rows] = await pool.execute(
    `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) AND is_active = TRUE LIMIT 1`,
    [name.trim()]
  );
  return rows[0] || null;
};

export const createCategory = async ({ name, description }) => {
  const [result] = await pool.execute(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [name.trim(), description ? description.trim() : null]
  );
  return {
    id: result.insertId,
    name: name.trim(),
    description: description ? description.trim() : '',
  };
};

export const updateCategory = async (id, { name, description }) => {
  await pool.execute(
    `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
    [name.trim(), description ? description.trim() : null, id]
  );
  return {
    id: Number(id),
    name: name.trim(),
    description: description ? description.trim() : '',
  };
};

export const deleteCategory = async (id) => {
  await pool.execute(
    `UPDATE categories SET is_active = FALSE WHERE id = ?`,
    [id]
  );
  return true;
};
