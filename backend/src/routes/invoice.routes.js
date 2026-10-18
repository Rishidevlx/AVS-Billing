import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';

const router = Router();

router.get('/', invoiceController.getAllInvoices);
router.post('/', invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', invoiceController.updateInvoice);
router.post('/:id/pdf', invoiceController.uploadInvoicePdf);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;

