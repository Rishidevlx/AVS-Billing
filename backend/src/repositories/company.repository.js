import pool from '../config/db.js';

export const getCompanyDetails = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM company_details ORDER BY id ASC LIMIT 1'
  );
  return rows[0] || null;
};

export const upsertCompanyDetails = async ({
  companyName,
  gstin,
  mobile,
  email,
  address,
  logoUrl,
  signatureUrl,
}) => {
  const existing = await getCompanyDetails();

  if (existing) {
    await pool.execute(
      `UPDATE company_details 
       SET company_name = ?, 
           gstin = ?, 
           mobile = ?, 
           email = ?, 
           address = ?, 
           logo_url = ?, 
           signature_url = ? 
       WHERE id = ?`,
      [
        companyName,
        gstin || null,
        mobile,
        email,
        address,
        logoUrl,
        signatureUrl,
        existing.id,
      ]
    );

    return { id: existing.id, companyName, gstin, mobile, email, address, logoUrl, signatureUrl };
  } else {
    const [result] = await pool.execute(
      `INSERT INTO company_details 
       (company_name, gstin, mobile, email, address, logo_url, signature_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName,
        gstin || null,
        mobile,
        email,
        address,
        logoUrl,
        signatureUrl,
      ]
    );

    return { id: result.insertId, companyName, gstin, mobile, email, address, logoUrl, signatureUrl };
  }
};
