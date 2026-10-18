import pool from '../config/db.js';

export const getBankDetails = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM bank_account_details ORDER BY id ASC LIMIT 1'
  );
  return rows[0] || null;
};

export const upsertBankDetails = async ({
  bankName,
  accountName,
  accountNumber,
  ifscCode,
  branchLocation,
}) => {
  const existing = await getBankDetails();

  if (existing) {
    await pool.execute(
      `UPDATE bank_account_details 
       SET bank_name = ?, 
           account_name = ?, 
           account_number = ?, 
           ifsc_code = ?, 
           branch_location = ? 
       WHERE id = ?`,
      [bankName, accountName, accountNumber, ifscCode, branchLocation, existing.id]
    );

    return {
      id: existing.id,
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      branchLocation,
    };
  } else {
    const [result] = await pool.execute(
      `INSERT INTO bank_account_details 
       (bank_name, account_name, account_number, ifsc_code, branch_location) 
       VALUES (?, ?, ?, ?, ?)`,
      [bankName, accountName, accountNumber, ifscCode, branchLocation]
    );

    return {
      id: result.insertId,
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      branchLocation,
    };
  }
};
