import pool from '../config/db.js';

export const getAllProducts = async () => {
  const [rows] = await pool.execute(`
    SELECT 
      id, 
      name, 
      category, 
      brand, 
      hsn_code AS hsnCode, 
      unit, 
      CAST(selling_price AS DOUBLE) AS sellingPrice, 
      CASE WHEN is_active = 1 THEN TRUE ELSE FALSE END AS status, 
      DATE_FORMAT(created_at, '%d %b %Y') AS createdAt,
      created_at
    FROM products 
    ORDER BY id DESC
  `);
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await pool.execute(`
    SELECT 
      id, 
      name, 
      category, 
      brand, 
      hsn_code AS hsnCode, 
      unit, 
      CAST(selling_price AS DOUBLE) AS sellingPrice, 
      CASE WHEN is_active = 1 THEN TRUE ELSE FALSE END AS status, 
      DATE_FORMAT(created_at, '%d %b %Y') AS createdAt 
    FROM products 
    WHERE id = ? 
    LIMIT 1
  `, [id]);
  return rows[0] || null;
};

export const createProduct = async ({
  name,
  category,
  brand,
  hsnCode,
  unit,
  sellingPrice,
  status = true,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO products (name, category, brand, hsn_code, unit, selling_price, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      category.trim(),
      brand ? brand.trim() : null,
      hsnCode ? hsnCode.trim() : null,
      unit,
      Number(sellingPrice),
      status ? 1 : 0,
    ]
  );

  return {
    id: result.insertId,
    name: name.trim(),
    category: category.trim(),
    brand: brand ? brand.trim() : null,
    hsnCode: hsnCode ? hsnCode.trim() : null,
    unit,
    sellingPrice: Number(sellingPrice),
    status: Boolean(status),
  };
};

export const updateProduct = async (
  id,
  { name, category, brand, hsnCode, unit, sellingPrice, status = true }
) => {
  await pool.execute(
    `UPDATE products 
     SET name = ?, category = ?, brand = ?, hsn_code = ?, unit = ?, selling_price = ?, is_active = ?
     WHERE id = ?`,
    [
      name.trim(),
      category.trim(),
      brand ? brand.trim() : null,
      hsnCode ? hsnCode.trim() : null,
      unit,
      Number(sellingPrice),
      status ? 1 : 0,
      id,
    ]
  );

  return {
    id: Number(id),
    name: name.trim(),
    category: category.trim(),
    brand: brand ? brand.trim() : null,
    hsnCode: hsnCode ? hsnCode.trim() : null,
    unit,
    sellingPrice: Number(sellingPrice),
    status: Boolean(status),
  };
};

export const deleteProduct = async (id) => {
  await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
  return true;
};

export const getProductStats = async () => {
  const [rows] = await pool.execute(`
    SELECT 
      COUNT(*) AS totalProducts,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeProducts,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactiveProducts,
      COUNT(DISTINCT category) AS totalCategories
    FROM products
  `);

  return {
    totalProducts: Number(rows[0]?.totalProducts || 0),
    activeProducts: Number(rows[0]?.activeProducts || 0),
    inactiveProducts: Number(rows[0]?.inactiveProducts || 0),
    totalCategories: Number(rows[0]?.totalCategories || 0),
  };
};
