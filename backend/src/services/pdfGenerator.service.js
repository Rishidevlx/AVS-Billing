import PDFDocument from 'pdfkit';

/**
 * Fetch image buffer from remote URL with timeout
 * @param {string} url
 * @returns {Promise<Buffer|null>}
 */
async function fetchImageBuffer(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

/**
 * Format currency in Indian Rupees style
 * @param {number|string} val
 * @returns {string}
 */
function formatCurrency(val) {
  const num = Number(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format Date to DD Mon YYYY (e.g. 18 Oct 2026)
 * @param {string|Date} dateVal
 * @returns {string}
 */
function formatDate(dateVal) {
  try {
    const d = dateVal ? new Date(dateVal) : new Date();
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

/**
 * Draw a clean vector logo badge if image is not loaded
 */
function drawDefaultLogoBadge(doc, x, y, width, height, companyName = 'AVS') {
  doc
    .roundedRect(x, y, width, height, 6)
    .fill('#0D3B66');

  const initials = (companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'AVS').toUpperCase();
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#FFFFFF')
    .text(initials, x, y + 15, {
      width,
      align: 'center',
    });
}

/**
 * Render Header & Receipt Meta Bar (Common to all pages)
 */
function renderPageTop(doc, { company, invoice, logoBuffer, marginX, contentWidth, primaryBlue, textDark, textMuted, textLight, borderSlate, bgLight }) {
  const headerStartY = 28;
  const logoWidth = 46;
  const logoHeight = 46;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, marginX, headerStartY, {
        fit: [logoWidth, logoHeight],
        align: 'center',
        valign: 'center',
      });
    } catch {
      drawDefaultLogoBadge(doc, marginX, headerStartY, logoWidth, logoHeight, company.companyName);
    }
  } else {
    drawDefaultLogoBadge(doc, marginX, headerStartY, logoWidth, logoHeight, company.companyName);
  }

  const textStartX = marginX + logoWidth + 12;
  const companyTitle = (company.companyName || company.company_name || 'AVS CRACKERS').toUpperCase();
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(primaryBlue)
    .text(companyTitle, textStartX, headerStartY + 2);

  const addressStr = company.address || 'Sivakasi, Tamil Nadu - 626123';
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textMuted)
    .text(addressStr, textStartX, headerStartY + 19, { width: 300, lineGap: 1 });

  const contactStr = `Mobile: ${company.mobile || '+91 8590605553'}   |   Email: ${company.email || 'support@avsbilling.com'}`;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(textLight)
    .text(contactStr, textStartX, headerStartY + 33, { width: 330 });

  // Right Side: GSTIN
  const rightX = marginX + contentWidth - 150;
  if (company.gstin) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(textMuted)
      .text('GSTIN', rightX, headerStartY + 10, { width: 150, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(textDark)
      .text(company.gstin, rightX, headerStartY + 22, { width: 150, align: 'right' });
  }

  let currentY = headerStartY + 54;

  // Header dividing line
  doc
    .moveTo(marginX, currentY)
    .lineTo(marginX + contentWidth, currentY)
    .strokeColor(borderSlate)
    .lineWidth(1)
    .stroke();

  currentY += 6;
  const metaBarHeight = 24;
  doc
    .rect(marginX, currentY, contentWidth, metaBarHeight)
    .fill(bgLight);
  doc
    .rect(marginX, currentY, contentWidth, metaBarHeight)
    .strokeColor(borderSlate)
    .lineWidth(0.75)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(textMuted)
    .text('RECEIPT NO: ', marginX + 12, currentY + 7);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(primaryBlue)
    .text(invoice.invoiceNumber || 'REC/0001', marginX + 75, currentY + 6.5);

  const dateText = formatDate(invoice.invoiceDate);
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(textMuted)
    .text('RECEIPT DATE: ', marginX + contentWidth - 180, currentY + 7, { width: 80, align: 'right' });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(textDark)
    .text(dateText, marginX + contentWidth - 95, currentY + 7, { width: 85, align: 'left' });

  return currentY + metaBarHeight + 8;
}

/**
 * Render Customer Details Box (ONLY ON PAGE 1)
 */
function renderCustomerDetails(doc, invoice, currentY, marginX, contentWidth, primaryBlue, textDark, borderSlate) {
  const customerBoxHeight = 74;
  const colWidth = contentWidth / 2;

  doc
    .rect(marginX, currentY, contentWidth, customerBoxHeight)
    .strokeColor(borderSlate)
    .lineWidth(0.75)
    .stroke();

  doc
    .moveTo(marginX + colWidth, currentY)
    .lineTo(marginX + colWidth, currentY + customerBoxHeight)
    .strokeColor(borderSlate)
    .lineWidth(0.75)
    .stroke();

  const custName = invoice.customerName || invoice.customer?.name || 'Customer';
  const custMobile = invoice.customerMobile || invoice.customer?.mobile || '-';
  const billingAddr = invoice.billingAddress || invoice.customer?.billingAddress || 'Tamil Nadu';
  const deliveryAddr = invoice.deliveryAddress || invoice.customer?.deliveryAddress || billingAddr;

  // Left Column: Customer Details
  const leftColX = marginX + 12;
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryBlue)
    .text('CUSTOMER DETAILS', leftColX, currentY + 8);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(custName, leftColX, currentY + 20, { width: colWidth - 24, ellipsis: true });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(billingAddr, leftColX, currentY + 33, { width: colWidth - 24, height: 22, ellipsis: true });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(`Mobile: ${custMobile}`, leftColX, currentY + 57);

  // Right Column: Delivery Address
  const rightColX = marginX + colWidth + 12;
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryBlue)
    .text('DELIVERY ADDRESS', rightColX, currentY + 8);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(custName, rightColX, currentY + 20, { width: colWidth - 24, ellipsis: true });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(deliveryAddr, rightColX, currentY + 33, { width: colWidth - 24, height: 22, ellipsis: true });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(`Mobile: ${custMobile}`, rightColX, currentY + 57);

  return currentY + customerBoxHeight + 10;
}

/**
 * Render Deep Blue Footer Bar at bottom of each page
 */
function renderPageFooter(doc, company, pageWidth, pageHeight, primaryBlue) {
  const footerHeight = 28;
  const footerY = pageHeight - footerHeight;

  doc
    .rect(0, footerY, pageWidth, footerHeight)
    .fill(primaryBlue);

  const fPhone = company.mobile || '+91 8590605553';
  const fEmail = company.email || 'support@avsbilling.com';
  const fAddr = company.address || 'AVS Crackers, Sivakasi, Tamil Nadu - 626123';

  const footerText = `Phone: ${fPhone}     |     Email: ${fEmail}     |     Address: ${fAddr}`;
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor('#FFFFFF')
    .text(footerText, 20, footerY + 10, {
      width: pageWidth - 40,
      align: 'center',
      ellipsis: true,
    });
}

/**
 * Render Table Header Row (Repeated on every page)
 */
function renderTableHeader(doc, tableX, currentY, contentWidth, tableHeaderBg, borderDarker, textDark, cols) {
  const tableHeaderHeight = 22;
  doc
    .rect(tableX, currentY, contentWidth, tableHeaderHeight)
    .fill(tableHeaderBg);

  doc
    .rect(tableX, currentY, contentWidth, tableHeaderHeight)
    .strokeColor(borderDarker)
    .lineWidth(0.75)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
  doc.text('S.No', cols.colSNoX, currentY + 7, { width: cols.colSNoWidth, align: 'center' });
  doc.text('Item Name', cols.colNameX + 6, currentY + 7, { width: cols.colNameWidth - 6 });
  doc.text('Category', cols.colCatX + 4, currentY + 7, { width: cols.colCatWidth - 4 });
  doc.text('Qty', cols.colQtyX, currentY + 7, { width: cols.colQtyWidth, align: 'center' });
  doc.text('Rate (Rs.)', cols.colRateX, currentY + 7, { width: cols.colRateWidth - 6, align: 'right' });
  doc.text('Amount (Rs.)', cols.colAmtX, currentY + 7, { width: cols.colAmtWidth - 6, align: 'right' });

  return currentY + tableHeaderHeight;
}

/**
 * Generate official pure A4 PDF receipt with dynamic multi-page pagination:
 * - Page 1 has: Header, Receipt No/Date, Customer Details, Table, Footer
 * - Page 2+ has: Header, Receipt No/Date, Table (NO customer box), Footer
 * - Final page has: Table Total, Amount in Words, Spacious Signatory with underline, Note
 *
 * @param {object} invoice - invoice data
 * @param {Array} items - array of line items
 * @param {object} company - company details
 * @param {object} bank - bank details
 * @returns {Promise<Buffer>} - Pure PDF binary Buffer
 */
export async function generateInvoicePdf(invoice, items = [], company = {}, bank = {}) {
  const [logoBuffer, signatureBuffer] = await Promise.all([
    fetchImageBuffer(company.logo || company.logo_url),
    fetchImageBuffer(company.signature || company.signature_url),
  ]);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 points
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `Receipt_${invoice.invoiceNumber || 'REC'}`,
          Author: company.companyName || 'AVS Crackers',
          Subject: 'Payment Receipt',
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const marginX = 36;
      const contentWidth = pageWidth - marginX * 2; // 523.28 pt

      // Theme Colors
      const primaryBlue = '#0D3B66';
      const textDark = '#1E293B';
      const textMuted = '#64748B';
      const textLight = '#475569';
      const borderSlate = '#E2E8F0';
      const borderDarker = '#CBD5E1';
      const bgLight = '#F8FAFC';
      const tableHeaderBg = '#F1F5F9';

      // Table Column Definitions
      const tableX = marginX;
      const cols = {
        colSNoWidth: 36,
        colNameWidth: 175,
        colCatWidth: 100,
        colQtyWidth: 45,
        colRateWidth: 80,
        colAmtWidth: 87.28,
        colSNoX: tableX,
        colNameX: tableX + 36,
        colCatX: tableX + 36 + 175,
        colQtyX: tableX + 36 + 175 + 100,
        colRateX: tableX + 36 + 175 + 100 + 45,
        colAmtX: tableX + 36 + 175 + 100 + 45 + 80,
      };

      const topConfig = {
        company,
        invoice,
        logoBuffer,
        marginX,
        contentWidth,
        primaryBlue,
        textDark,
        textMuted,
        textLight,
        borderSlate,
        bgLight,
      };

      // ==========================================
      // START PAGE 1
      // ==========================================
      let currentY = renderPageTop(doc, topConfig);
      currentY = renderCustomerDetails(doc, invoice, currentY, marginX, contentWidth, primaryBlue, textDark, borderSlate);
      currentY = renderTableHeader(doc, tableX, currentY, contentWidth, tableHeaderBg, borderDarker, textDark, cols);
      renderPageFooter(doc, company, pageWidth, pageHeight, primaryBlue);

      // Heights & Safety Limits
      const rowHeight = 20;
      const bottomSectionHeight = 220; // Space needed on the final page for totals, signature, note
      const maxTableYBeforeFooter = pageHeight - 48; // ~793 pt (leaves 20pt buffer above 28pt footer)
      const maxTableYForFinalItems = maxTableYBeforeFooter - bottomSectionHeight; // ~573 pt

      let totalQty = 0;
      let calculatedSubtotal = 0;

      // Render Each Item Row with Multi-Page Detection
      items.forEach((item, index) => {
        const isLastItem = index === items.length - 1;

        // Check if adding this row would cause overflow:
        // - If last item: check if item + bottom section fits
        // - If not last item: check if item fits before footer
        const needNewPage = isLastItem
          ? (currentY + rowHeight > maxTableYForFinalItems)
          : (currentY + rowHeight > maxTableYBeforeFooter - 10);

        if (needNewPage) {
          // Add New Page
          doc.addPage();

          // Render Page Top (Header + Meta Bar)
          currentY = renderPageTop(doc, topConfig);

          // NOTE: NO customer details on Page 2+ as requested!
          // Render Table Header directly
          currentY = renderTableHeader(doc, tableX, currentY, contentWidth, tableHeaderBg, borderDarker, textDark, cols);

          // Render Footer for this new page
          renderPageFooter(doc, company, pageWidth, pageHeight, primaryBlue);
        }

        // Draw Row Zebra Background
        const isZebra = index % 2 === 1;
        if (isZebra) {
          doc
            .rect(tableX, currentY, contentWidth, rowHeight)
            .fill(bgLight);
        }

        // Bottom border line for row
        doc
          .moveTo(tableX, currentY + rowHeight)
          .lineTo(tableX + contentWidth, currentY + rowHeight)
          .strokeColor(borderSlate)
          .lineWidth(0.5)
          .stroke();

        const itemQty = Number(item.qty || 1);
        const itemRate = Number(item.rate || 0);
        const itemTotal = Number(item.total || itemQty * itemRate);

        totalQty += itemQty;
        calculatedSubtotal += itemTotal;

        // Uniform typography
        doc.font('Helvetica').fontSize(8.5).fillColor(textDark);
        doc.text(String(index + 1), cols.colSNoX, currentY + 5.5, { width: cols.colSNoWidth, align: 'center' });

        const prodName = item.productName || item.name || 'Product Item';
        doc.text(prodName, cols.colNameX + 6, currentY + 5.5, {
          width: cols.colNameWidth - 10,
          ellipsis: true,
        });

        const catName = item.category || '-';
        doc.text(catName, cols.colCatX + 4, currentY + 5.5, {
          width: cols.colCatWidth - 8,
          ellipsis: true,
        });

        doc.text(String(itemQty), cols.colQtyX, currentY + 5.5, { width: cols.colQtyWidth, align: 'center' });
        doc.text(itemRate.toFixed(2), cols.colRateX, currentY + 5.5, { width: cols.colRateWidth - 6, align: 'right' });
        doc.text(itemTotal.toFixed(2), cols.colAmtX, currentY + 5.5, {
          width: cols.colAmtWidth - 6,
          align: 'right',
        });

        currentY += rowHeight;
      });

      // ==========================================
      // FINAL SUMMARY ROW (Total Items, Total Qty, Subtotal)
      // ==========================================
      const subtotalVal = Number(invoice.subtotal) || calculatedSubtotal;
      doc
        .rect(tableX, currentY, contentWidth, rowHeight)
        .fill(tableHeaderBg);
      doc
        .rect(tableX, currentY, contentWidth, rowHeight)
        .strokeColor(borderDarker)
        .lineWidth(0.75)
        .stroke();

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(textDark);
      doc.text(`Total Items: ${items.length}`, cols.colNameX + 6, currentY + 5.5);
      doc.text(String(totalQty), cols.colQtyX, currentY + 5.5, { width: cols.colQtyWidth, align: 'center' });
      doc.text(formatCurrency(subtotalVal), cols.colAmtX, currentY + 5.5, { width: cols.colAmtWidth - 6, align: 'right' });

      currentY += rowHeight + 14;

      // ==========================================
      // BOTTOM SECTION (Amounts Breakdown, Signatory, Note)
      // Left side is clean and completely empty
      // Right side contains Breakdown, Total Amount, In Words, Signature & Note
      // ==========================================
      const bottomStartY = currentY;
      const rightSectionWidth = contentWidth * 0.48; // ~251 pt
      const rightBoxX = marginX + contentWidth - rightSectionWidth;
      const companyTitle = (company.companyName || company.company_name || 'AVS CRACKERS').toUpperCase();

      let calcY = bottomStartY;

      // Gross Amount
      doc.font('Helvetica').fontSize(8.5).fillColor(textMuted).text('Gross Amount:', rightBoxX, calcY);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(textDark)
        .text(formatCurrency(subtotalVal), rightBoxX, calcY, { width: rightSectionWidth, align: 'right' });
      calcY += 16;

      // Discount % (if applicable)
      const discPercent = Number(invoice.discountPercent || 0);
      const discAmt = Number(invoice.discountAmount || 0);
      if (discPercent > 0) {
        doc
          .font('Helvetica').fontSize(8)
          .fillColor('#10B981')
          .text(`Discount (${discPercent}%):`, rightBoxX, calcY);
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#10B981')
          .text(`- ${formatCurrency(discAmt)}`, rightBoxX, calcY, { width: rightSectionWidth, align: 'right' });
        calcY += 16;
      }

      // Divider line
      doc
        .moveTo(rightBoxX, calcY)
        .lineTo(rightBoxX + rightSectionWidth, calcY)
        .strokeColor(borderSlate)
        .lineWidth(1)
        .stroke();
      calcY += 6;

      // Total Amount Box
      const totalAmt = Number(invoice.grandTotal || subtotalVal - discAmt);
      doc
        .rect(rightBoxX, calcY, rightSectionWidth, 24)
        .fill(bgLight);
      doc
        .rect(rightBoxX, calcY, rightSectionWidth, 24)
        .strokeColor(primaryBlue)
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(primaryBlue)
        .text('TOTAL AMOUNT:', rightBoxX + 8, calcY + 7);
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor(primaryBlue)
        .text(formatCurrency(totalAmt), rightBoxX, calcY + 6, { width: rightSectionWidth - 8, align: 'right' });
      calcY += 30;

      // Amount in Words directly below Total Amount
      if (invoice.amountInWords) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(`Amount in Words: ${invoice.amountInWords}`, rightBoxX, calcY, {
            width: rightSectionWidth,
            align: 'right',
          });
        calcY += 16;
      }

      // Authorized Signatory with spacious top margin & underline below digital signature
      const sigY = calcY + 36;
      const sigWidth = 120;
      const sigX = rightBoxX + rightSectionWidth - sigWidth;

      if (signatureBuffer) {
        try {
          doc.image(signatureBuffer, sigX + 10, sigY - 26, {
            fit: [sigWidth - 20, 24],
            align: 'center',
          });
        } catch {
          // ignore signature image load error
        }
      }

      // Underline under the signature image
      doc
        .moveTo(sigX, sigY + 2)
        .lineTo(sigX + sigWidth, sigY + 2)
        .strokeColor(borderDarker)
        .lineWidth(0.75)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(textMuted)
        .text('Authorized Signatory', sigX, sigY + 6, { width: sigWidth, align: 'center' });

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(primaryBlue)
        .text(companyTitle, sigX, sigY + 17, { width: sigWidth, align: 'center' });

      // Note placed right below AVS CRACKERS
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor(textMuted)
        .text('Note: Thank you for your business!', rightBoxX, sigY + 32, {
          width: rightSectionWidth,
          align: 'right',
        });

      // End Document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
