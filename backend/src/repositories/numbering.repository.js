import pool from '../config/db.js';

export const getNumberingSettings = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM invoice_numbering_settings ORDER BY id ASC LIMIT 1'
  );
  return rows[0] || null;
};

export const upsertNumberingSettings = async ({ invoicePrefix, currentSequence }) => {
  const existing = await getNumberingSettings();

  if (existing) {
    const seq = currentSequence !== undefined ? currentSequence : existing.current_sequence;
    await pool.execute(
      `UPDATE invoice_numbering_settings 
       SET invoice_prefix = ?, 
           current_sequence = ? 
       WHERE id = ?`,
      [invoicePrefix, seq, existing.id]
    );

    return {
      id: existing.id,
      invoicePrefix,
      currentSequence: seq,
    };
  } else {
    const seq = currentSequence !== undefined ? currentSequence : 1;
    const [result] = await pool.execute(
      `INSERT INTO invoice_numbering_settings 
       (invoice_prefix, current_sequence) 
       VALUES (?, ?)`,
      [invoicePrefix, seq]
    );

    return {
      id: result.insertId,
      invoicePrefix,
      currentSequence: seq,
    };
  }
};

export const resetSequence = async () => {
  const existing = await getNumberingSettings();

  if (existing) {
    await pool.execute(
      `UPDATE invoice_numbering_settings 
       SET current_sequence = 1 
       WHERE id = ?`,
      [existing.id]
    );

    return {
      id: existing.id,
      invoicePrefix: existing.invoice_prefix,
      currentSequence: 1,
    };
  } else {
    const [result] = await pool.execute(
      `INSERT INTO invoice_numbering_settings 
       (invoice_prefix, current_sequence) 
       VALUES (?, ?)`,
      ['REC', 1]
    );

    return {
      id: result.insertId,
      invoicePrefix: 'REC',
      currentSequence: 1,
    };
  }
};
