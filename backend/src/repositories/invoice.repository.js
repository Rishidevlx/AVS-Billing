import pool from '../config/db.js';

export const createInvoice = async (invoiceData, itemsData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertInvoiceSql = `
      INSERT INTO invoices (
        invoice_number,
        invoice_date,
        customer_name,
        customer_mobile,
        billing_address,
        delivery_address,
        subtotal,
        discount_percent,
        discount_amount,
        grand_total,
        total_items_count,
        total_qty,
        amount_in_words,
        pdf_url,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [invoiceResult] = await connection.query(insertInvoiceSql, [
      invoiceData.invoiceNumber,
      invoiceData.invoiceDate,
      invoiceData.customerName,
      invoiceData.customerMobile,
      invoiceData.billingAddress,
      invoiceData.deliveryAddress || invoiceData.billingAddress,
      invoiceData.subtotal || 0,
      invoiceData.discountPercent || 0,
      invoiceData.discountAmount || 0,
      invoiceData.grandTotal || 0,
      invoiceData.totalItemsCount || itemsData.length,
      invoiceData.totalQty || itemsData.reduce((sum, i) => sum + (Number(i.qty) || 1), 0),
      invoiceData.amountInWords || '',
      invoiceData.pdfUrl || null,
      invoiceData.status || 'COMPLETED',
    ]);

    const invoiceId = invoiceResult.insertId;

    // Insert items
    if (itemsData && itemsData.length > 0) {
      const insertItemSql = `
        INSERT INTO invoice_items (
          invoice_id,
          product_id,
          product_name,
          category,
          unit,
          rate,
          qty,
          total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const item of itemsData) {
        await connection.query(insertItemSql, [
          invoiceId,
          item.productId || null,
          item.productName,
          item.category || '',
          item.unit || 'PCS',
          item.rate || 0,
          item.qty || 1,
          item.total || 0,
        ]);
      }
    }

    // Increment current sequence in numbering settings
    await connection.query(`
      UPDATE invoice_numbering_settings 
      SET current_sequence = current_sequence + 1 
      ORDER BY id ASC LIMIT 1
    `);

    await connection.commit();
    return invoiceId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const findAllInvoices = async ({ search = '' } = {}) => {
  let sql = `
    SELECT 
      id,
      invoice_number AS invoiceNumber,
      invoice_date AS invoiceDate,
      customer_name AS customerName,
      customer_mobile AS customerMobile,
      billing_address AS billingAddress,
      delivery_address AS deliveryAddress,
      subtotal,
      discount_percent AS discountPercent,
      discount_amount AS discountAmount,
      grand_total AS grandTotal,
      total_items_count AS totalItemsCount,
      total_qty AS totalQty,
      amount_in_words AS amountInWords,
      pdf_url AS pdfUrl,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM invoices
  `;

  const params = [];

  if (search && search.trim()) {
    sql += `
      WHERE invoice_number LIKE ? 
         OR customer_name LIKE ? 
         OR customer_mobile LIKE ?
    `;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY id DESC`;

  const [rows] = await pool.query(sql, params);
  if (rows.length === 0) return [];

  // Fetch all items for these invoices in a single query
  const invoiceIds = rows.map((r) => r.id);
  const [itemRows] = await pool.query(
    `
    SELECT 
      id,
      invoice_id AS invoiceId,
      product_id AS productId,
      product_name AS productName,
      category,
      unit,
      rate,
      qty,
      total
    FROM invoice_items
    WHERE invoice_id IN (?)
    ORDER BY id ASC
    `,
    [invoiceIds]
  );

  const itemsByInvoiceId = {};
  for (const item of itemRows) {
    if (!itemsByInvoiceId[item.invoiceId]) {
      itemsByInvoiceId[item.invoiceId] = [];
    }
    itemsByInvoiceId[item.invoiceId].push(item);
  }

  for (const row of rows) {
    row.items = itemsByInvoiceId[row.id] || [];
  }

  return rows;
};

export const updateInvoice = async (id, invoiceData, itemsData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updateInvoiceSql = `
      UPDATE invoices SET
        invoice_date = ?,
        customer_name = ?,
        customer_mobile = ?,
        billing_address = ?,
        delivery_address = ?,
        subtotal = ?,
        discount_percent = ?,
        discount_amount = ?,
        grand_total = ?,
        total_items_count = ?,
        total_qty = ?,
        amount_in_words = ?,
        pdf_url = COALESCE(?, pdf_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(updateInvoiceSql, [
      invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
      invoiceData.customerName,
      invoiceData.customerMobile,
      invoiceData.billingAddress || '',
      invoiceData.deliveryAddress || '',
      invoiceData.subtotal || 0,
      invoiceData.discountPercent || 0,
      invoiceData.discountAmount || 0,
      invoiceData.grandTotal || 0,
      invoiceData.totalItemsCount || itemsData.length,
      invoiceData.totalQty || 1,
      invoiceData.amountInWords || '',
      invoiceData.pdfUrl || null,
      id,
    ]);

    // Replace items
    await connection.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);

    if (itemsData && itemsData.length > 0) {
      const insertItemSql = `
        INSERT INTO invoice_items (
          invoice_id,
          product_id,
          product_name,
          category,
          unit,
          rate,
          qty,
          total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const item of itemsData) {
        await connection.query(insertItemSql, [
          id,
          item.productId || null,
          item.productName,
          item.category || '',
          item.unit || 'PCS',
          item.rate || 0,
          item.qty || 1,
          item.total || 0,
        ]);
      }
    }

    await connection.commit();
    return id;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const findInvoiceById = async (id) => {
  const [invoiceRows] = await pool.query(
    `
    SELECT 
      id,
      invoice_number AS invoiceNumber,
      invoice_date AS invoiceDate,
      customer_name AS customerName,
      customer_mobile AS customerMobile,
      billing_address AS billingAddress,
      delivery_address AS deliveryAddress,
      subtotal,
      discount_percent AS discountPercent,
      discount_amount AS discountAmount,
      grand_total AS grandTotal,
      total_items_count AS totalItemsCount,
      total_qty AS totalQty,
      amount_in_words AS amountInWords,
      pdf_url AS pdfUrl,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM invoices
    WHERE id = ?
    `,
    [id]
  );

  if (invoiceRows.length === 0) return null;

  const invoice = invoiceRows[0];

  const [itemRows] = await pool.query(
    `
    SELECT 
      id,
      invoice_id AS invoiceId,
      product_id AS productId,
      product_name AS productName,
      category,
      unit,
      rate,
      qty,
      total
    FROM invoice_items
    WHERE invoice_id = ?
    ORDER BY id ASC
    `,
    [id]
  );

  invoice.items = itemRows;
  return invoice;
};

export const deleteInvoice = async (id) => {
  const [result] = await pool.query(`DELETE FROM invoices WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

export const getInvoiceStats = async () => {
  const [rows] = await pool.query(`
    SELECT 
      COUNT(*) AS totalInvoices,
      COALESCE(SUM(grand_total), 0) AS totalSales,
      COALESCE(SUM(total_qty), 0) AS totalQtySold,
      COALESCE(AVG(grand_total), 0) AS avgBillValue
    FROM invoices
  `);

  return rows[0] || {
    totalInvoices: 0,
    totalSales: 0,
    totalQtySold: 0,
    avgBillValue: 0,
  };
};

export const updateInvoicePdfUrl = async (idOrNumber, pdfUrl) => {
  const [result] = await pool.query(
    `UPDATE invoices SET pdf_url = ? WHERE id = ? OR invoice_number = ?`,
    [pdfUrl, idOrNumber, idOrNumber]
  );
  return result.affectedRows > 0;
};

