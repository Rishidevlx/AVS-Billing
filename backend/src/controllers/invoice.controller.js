import * as invoiceService from '../services/invoice.service.js';

export const createInvoice = async (req, res) => {
  try {
    const { invoice, items } = req.body;
    if (!invoice || !items) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload: invoice and items are required',
      });
    }

    const created = await invoiceService.createInvoice(invoice, items);
    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: created,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create invoice',
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const { search } = req.query;
    const invoices = await invoiceService.getAllInvoices({ search });
    const stats = await invoiceService.getInvoiceStats();

    return res.status(200).json({
      success: true,
      data: invoices,
      stats,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch invoices',
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(id);
    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Invoice not found',
    });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { invoice, items } = req.body;
    if (!invoice || !items) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload: invoice and items are required',
      });
    }

    const updated = await invoiceService.updateInvoice(id, invoice, items);
    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to update invoice',
    });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await invoiceService.deleteInvoice(id);
    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to delete invoice',
    });
  }
};

export const uploadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfBase64 } = req.body || {};

    const pdfUrl = await invoiceService.attachPdfToInvoice(id, pdfBase64);
    return res.status(200).json({
      success: true,
      message: 'PDF receipt uploaded to Cloudinary successfully',
      data: { pdfUrl },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload PDF receipt',
    });
  }
};

