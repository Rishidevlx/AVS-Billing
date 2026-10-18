import pool from '../config/db.js';

export const getDashboardSummary = async ({ period = '1W', startDate = null, endDate = null } = {}) => {
  const hasCustomRange = Boolean((startDate && startDate.trim()) || (endDate && endDate.trim()));

  // 1. Overall stats (all-time)
  const [overallRows] = await pool.query(`
    SELECT 
      COUNT(*) AS totalInvoices,
      COALESCE(SUM(grand_total), 0) AS totalSales,
      COALESCE(SUM(total_qty), 0) AS totalQtySold,
      COALESCE(AVG(grand_total), 0) AS avgBillValue
    FROM invoices
  `);

  // 2. Today's stats
  const [todayRows] = await pool.query(`
    SELECT 
      COUNT(*) AS todayBills,
      COALESCE(SUM(grand_total), 0) AS todaySales,
      COALESCE(SUM(total_qty), 0) AS todayQty
    FROM invoices
    WHERE DATE(invoice_date) = CURDATE() OR DATE(created_at) = CURDATE()
  `);

  // 3. Yesterday's stats (for growth percentage)
  const [yesterdayRows] = await pool.query(`
    SELECT 
      COALESCE(SUM(grand_total), 0) AS yesterdaySales
    FROM invoices
    WHERE DATE(invoice_date) = SUBDATE(CURDATE(), 1)
  `);

  // 4. Products, Categories & Real Unique Customers count
  const [productCountRows] = await pool.query(`
    SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = 1
  `);
  const [categoryCountRows] = await pool.query(`
    SELECT COUNT(*) AS totalCategories FROM categories WHERE is_active = 1
  `);
  const [customerCountRows] = await pool.query(`
    SELECT COUNT(DISTINCT customer_mobile) AS totalCustomers 
    FROM invoices 
    WHERE customer_mobile IS NOT NULL AND customer_mobile != ''
  `);

  // Prepare Date Range Clause if custom date range provided
  let dateWhereClause = '';
  const dateParams = [];

  if (hasCustomRange) {
    const s = startDate ? startDate.trim() : null;
    const e = endDate ? endDate.trim() : null;
    if (s && e) {
      dateWhereClause = 'WHERE inv.invoice_date BETWEEN ? AND ?';
      dateParams.push(s, e);
    } else if (s) {
      dateWhereClause = 'WHERE inv.invoice_date >= ?';
      dateParams.push(s);
    } else if (e) {
      dateWhereClause = 'WHERE inv.invoice_date <= ?';
      dateParams.push(e);
    }
  }

  // 5. Custom Range KPIs (if range active)
  let rangeStats = null;
  if (hasCustomRange) {
    const [rRows] = await pool.query(`
      SELECT 
        COUNT(*) AS rangeBills,
        COALESCE(SUM(inv.grand_total), 0) AS rangeSales,
        COALESCE(SUM(inv.total_qty), 0) AS rangeQty,
        COALESCE(AVG(inv.grand_total), 0) AS rangeAvgBillValue,
        COUNT(DISTINCT inv.customer_mobile) AS rangeCustomers
      FROM invoices inv
      ${dateWhereClause}
    `, dateParams);
    rangeStats = rRows[0] || {};
  }

  // 6. Dynamic Sales Trend based on custom range or period
  let trendSql = '';
  let trendParams = [];

  if (hasCustomRange) {
    trendSql = `
      SELECT 
        DATE_FORMAT(inv.invoice_date, '%Y-%m-%d') AS dateKey,
        DATE_FORMAT(inv.invoice_date, '%d %b') AS dateLabel,
        COALESCE(SUM(inv.grand_total), 0) AS totalSales,
        COUNT(*) AS billCount,
        COALESCE(SUM(inv.total_qty), 0) AS totalQty
      FROM invoices inv
      ${dateWhereClause}
      GROUP BY DATE_FORMAT(inv.invoice_date, '%Y-%m-%d'), DATE_FORMAT(inv.invoice_date, '%d %b')
      ORDER BY dateKey ASC
    `;
    trendParams = [...dateParams];
  } else if (period === '1D') {
    trendSql = `
      SELECT 
        DATE_FORMAT(created_at, '%H:00') AS dateKey,
        DATE_FORMAT(created_at, '%h %p') AS dateLabel,
        COALESCE(SUM(grand_total), 0) AS totalSales,
        COUNT(*) AS billCount,
        COALESCE(SUM(total_qty), 0) AS totalQty
      FROM invoices
      WHERE DATE(invoice_date) = CURDATE() OR DATE(created_at) = CURDATE()
      GROUP BY DATE_FORMAT(created_at, '%H:00'), DATE_FORMAT(created_at, '%h %p')
      ORDER BY dateKey ASC
    `;
  } else if (period === '1M') {
    trendSql = `
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m-%d') AS dateKey,
        DATE_FORMAT(invoice_date, '%d %b') AS dateLabel,
        COALESCE(SUM(grand_total), 0) AS totalSales,
        COUNT(*) AS billCount,
        COALESCE(SUM(total_qty), 0) AS totalQty
      FROM invoices
      WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE_FORMAT(invoice_date, '%Y-%m-%d'), DATE_FORMAT(invoice_date, '%d %b')
      ORDER BY dateKey ASC
    `;
  } else if (period === '3M' || period === '6M' || period === '1Y') {
    const months = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    trendSql = `
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m') AS dateKey,
        DATE_FORMAT(invoice_date, '%b %Y') AS dateLabel,
        COALESCE(SUM(grand_total), 0) AS totalSales,
        COUNT(*) AS billCount,
        COALESCE(SUM(total_qty), 0) AS totalQty
      FROM invoices
      WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)
      GROUP BY DATE_FORMAT(invoice_date, '%Y-%m'), DATE_FORMAT(invoice_date, '%b %Y')
      ORDER BY dateKey ASC
    `;
  } else {
    // Default 1W (Last 7 Days)
    trendSql = `
      SELECT 
        DATE_FORMAT(invoice_date, '%Y-%m-%d') AS dateKey,
        DATE_FORMAT(invoice_date, '%d %b') AS dateLabel,
        COALESCE(SUM(grand_total), 0) AS totalSales,
        COUNT(*) AS billCount,
        COALESCE(SUM(total_qty), 0) AS totalQty
      FROM invoices
      WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(invoice_date, '%Y-%m-%d'), DATE_FORMAT(invoice_date, '%d %b')
      ORDER BY dateKey ASC
    `;
  }

  const [trendRows] = await pool.query(trendSql, trendParams);

  let finalTrend = trendRows;
  if (!hasCustomRange && period === '1D' && finalTrend.length === 0) {
    const todaySalesNum = Number(todayRows[0]?.todaySales || 0);
    const todayBillsNum = Number(todayRows[0]?.todayBills || 0);
    const todayQtyNum = Number(todayRows[0]?.todayQty || 0);
    if (todayBillsNum > 0) {
      finalTrend = [
        {
          dateKey: 'Today',
          dateLabel: 'Today',
          totalSales: todaySalesNum,
          billCount: todayBillsNum,
          totalQty: todayQtyNum,
        },
      ];
    }
  }

  // 7. Top 6 Fast Moving Products (Filtered by range if active)
  const topProductSql = `
    SELECT 
      ii.product_name AS productName,
      ii.category,
      SUM(ii.qty) AS totalQty,
      SUM(ii.total) AS totalRevenue,
      ROUND(AVG(ii.rate), 2) AS avgRate
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    ${hasCustomRange ? dateWhereClause : ''}
    ${hasCustomRange ? 'AND' : 'WHERE'} ii.product_name IS NOT NULL AND ii.product_name != ''
    GROUP BY ii.product_name, ii.category
    ORDER BY totalRevenue DESC
    LIMIT 6
  `;
  const [topProductRows] = await pool.query(topProductSql, hasCustomRange ? dateParams : []);

  // 8. Category Breakdown (Filtered by range if active)
  const categoryBreakdownSql = `
    SELECT 
      COALESCE(ii.category, 'General') AS category,
      SUM(ii.total) AS totalAmount,
      SUM(ii.qty) AS totalQty,
      COUNT(*) AS itemsCount
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    ${hasCustomRange ? dateWhereClause : ''}
    ${hasCustomRange ? 'AND' : 'WHERE'} ii.category IS NOT NULL AND ii.category != ''
    GROUP BY ii.category
    ORDER BY totalAmount DESC
    LIMIT 6
  `;
  const [categoryBreakdownRows] = await pool.query(categoryBreakdownSql, hasCustomRange ? dateParams : []);

  // 9. Recent Invoices for the table (Filtered by range if active)
  const recentSql = `
    SELECT 
      inv.id,
      inv.invoice_number AS invoiceNumber,
      inv.invoice_date AS invoiceDate,
      inv.customer_name AS customerName,
      inv.customer_mobile AS customerMobile,
      inv.grand_total AS grandTotal,
      inv.total_items_count AS totalItemsCount,
      inv.pdf_url AS pdfUrl,
      inv.created_at AS createdAt
    FROM invoices inv
    ${hasCustomRange ? dateWhereClause : ''}
    ORDER BY inv.id DESC
    LIMIT 8
  `;
  const [recentRows] = await pool.query(recentSql, hasCustomRange ? dateParams : []);

  const overall = overallRows[0] || {};
  const today = todayRows[0] || {};
  const yesterday = yesterdayRows[0] || {};

  const todaySalesNum = Number(today.todaySales || 0);
  const yesterdaySalesNum = Number(yesterday.yesterdaySales || 0);
  let salesGrowthPct = 0;
  if (yesterdaySalesNum > 0) {
    salesGrowthPct = Math.round(((todaySalesNum - yesterdaySalesNum) / yesterdaySalesNum) * 100);
  }

  const totalCatAmount = categoryBreakdownRows.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0) || 1;
  const categoriesWithPct = categoryBreakdownRows.map((c) => ({
    category: c.category,
    amount: Number(c.totalAmount || 0),
    qty: Number(c.totalQty || 0),
    percentage: Math.round((Number(c.totalAmount || 0) / totalCatAmount) * 100),
  }));

  return {
    hasCustomRange,
    kpi: {
      hasCustomRange,
      // If custom date range is active, provide range metrics for cards
      rangeSales: rangeStats ? Number(rangeStats.rangeSales || 0) : null,
      rangeBills: rangeStats ? Number(rangeStats.rangeBills || 0) : null,
      rangeQty: rangeStats ? Number(rangeStats.rangeQty || 0) : null,
      rangeAvgBillValue: rangeStats ? Number(rangeStats.rangeAvgBillValue || 0) : null,
      rangeCustomers: rangeStats ? Number(rangeStats.rangeCustomers || 0) : null,
      // Regular metrics
      todaySales: todaySalesNum,
      todayBills: Number(today.todayBills || 0),
      todayQty: Number(today.todayQty || 0),
      salesGrowthPct,
      totalSales: Number(overall.totalSales || 0),
      totalInvoices: Number(overall.totalInvoices || 0),
      totalQtySold: Number(overall.totalQtySold || 0),
      avgBillValue: Number(overall.avgBillValue || 0),
      totalProducts: Number(productCountRows[0]?.totalProducts || 0),
      totalCategories: Number(categoryCountRows[0]?.totalCategories || 0),
      totalCustomers: Number(customerCountRows[0]?.totalCustomers || 0),
    },
    salesTrend: finalTrend.map((r) => ({
      date: r.dateKey,
      label: r.dateLabel,
      sales: Number(r.totalSales || 0),
      bills: Number(r.billCount || 0),
      qty: Number(r.totalQty || 0),
    })),
    topProducts: topProductRows.map((r) => ({
      name: r.productName,
      category: r.category || 'General',
      qty: Number(r.totalQty || 0),
      revenue: Number(r.totalRevenue || 0),
      rate: Number(r.avgRate || 0),
    })),
    categoryBreakdown: categoriesWithPct,
    recentInvoices: recentRows,
  };
};
