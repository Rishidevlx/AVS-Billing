import * as invoiceRepo from '../repositories/invoice.repository.js';
import * as companyService from './company.service.js';
import * as bankService from './bank.service.js';
import { generateInvoicePdf } from './pdfGenerator.service.js';
import { uploadPdf } from '../config/cloudinary.js';

export const createInvoice = async (invoiceData, itemsData) => {
  if (!invoiceData.invoiceNumber) {
    throw new Error('Receipt / Invoice number is required');
  }
  if (!invoiceData.customerName || !invoiceData.customerName.trim()) {
    throw new Error('Customer name is required');
  }
  if (!invoiceData.customerMobile || !invoiceData.customerMobile.trim()) {
    throw new Error('Customer mobile number is required');
  }
  if (!itemsData || itemsData.length === 0) {
    throw new Error('At least one product line item is required');
  }

  // 1. Generate pure A4 PDF on backend & upload directly to Cloudinary (Option A)
  try {
    let pdfDataUri = invoiceData.pdfBase64;

    if (!pdfDataUri) {
      // Auto-generate pure vector A4 PDF using Node.js pdfkit
      const [companyDetails, bankDetails] = await Promise.all([
        companyService.fetchCompany().catch(() => null),
        bankService.fetchBank().catch(() => null),
      ]);

      const company = companyDetails || {
        companyName: 'AVS CRACKERS',
        mobile: '+91 8590605553',
        email: 'support@avsbilling.com',
        address: 'Sivakasi, Tamil Nadu - 626123',
      };
      const bank = bankDetails || {};

      const pdfBuffer = await generateInvoicePdf(invoiceData, itemsData, company, bank);
      pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    }

    if (pdfDataUri) {
      const uploadedUrl = await uploadPdf(
        pdfDataUri,
        invoiceData.invoiceNumber,
        'AVS/receipts'
      );
      invoiceData.pdfUrl = uploadedUrl;
    }
  } catch (pdfErr) {
    console.warn('[PDF Generation / Cloudinary Upload Warning]:', pdfErr.message);
  }

  const invoiceId = await invoiceRepo.createInvoice(invoiceData, itemsData);
  return await invoiceRepo.findInvoiceById(invoiceId);
};

export const attachPdfToInvoice = async (idOrNumber, pdfBase64 = null) => {
  const invoice = await invoiceRepo.findInvoiceById(idOrNumber);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  let finalBase64 = pdfBase64;
  if (!finalBase64) {
    const [companyDetails, bankDetails] = await Promise.all([
      companyService.fetchCompany().catch(() => null),
      bankService.fetchBank().catch(() => null),
    ]);
    const company = companyDetails || {};
    const bank = bankDetails || {};
    const pdfBuffer = await generateInvoicePdf(invoice, invoice.items || [], company, bank);
    finalBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  }

  const uploadedUrl = await uploadPdf(
    finalBase64,
    invoice.invoiceNumber || `receipt_${idOrNumber}`,
    'AVS/receipts'
  );
  await invoiceRepo.updateInvoicePdfUrl(invoice.id, uploadedUrl);
  return uploadedUrl;
};

export const getAllInvoices = async ({ search } = {}) => {
  return await invoiceRepo.findAllInvoices({ search });
};

export const getInvoiceById = async (id) => {
  const invoice = await invoiceRepo.findInvoiceById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  return invoice;
};

export const updateInvoice = async (id, invoiceData, itemsData) => {
  const existing = await invoiceRepo.findInvoiceById(id);
  if (!existing) {
    throw new Error('Invoice not found');
  }

  // Generate updated pure A4 PDF and upload to Cloudinary
  try {
    const [companyDetails, bankDetails] = await Promise.all([
      companyService.fetchCompany().catch(() => null),
      bankService.fetchBank().catch(() => null),
    ]);

    const company = companyDetails || {
      companyName: 'AVS CRACKERS',
      mobile: '+91 8590605553',
      email: 'support@avsbilling.com',
      address: 'Sivakasi, Tamil Nadu - 626123',
    };
    const bank = bankDetails || {};

    const pdfBuffer = await generateInvoicePdf(
      { ...existing, ...invoiceData, invoiceNumber: existing.invoiceNumber },
      itemsData,
      company,
      bank
    );
    const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    const uploadedUrl = await uploadPdf(
      pdfDataUri,
      existing.invoiceNumber,
      'AVS/receipts'
    );
    invoiceData.pdfUrl = uploadedUrl;
  } catch (pdfErr) {
    console.warn('[PDF Re-generation / Cloudinary Upload Warning]:', pdfErr.message);
  }

  await invoiceRepo.updateInvoice(id, invoiceData, itemsData);
  return await invoiceRepo.findInvoiceById(id);
};

export const deleteInvoice = async (id) => {
  const deleted = await invoiceRepo.deleteInvoice(id);
  if (!deleted) {
    throw new Error('Invoice not found or already deleted');
  }
  return true;
};

export const getInvoiceStats = async () => {
  return await invoiceRepo.getInvoiceStats();
};
