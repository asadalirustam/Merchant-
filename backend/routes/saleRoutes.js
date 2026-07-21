import express from 'express';
import {
  createSale,
  getInvoices,
  getInvoiceDetails,
  getSalesList,
  updateInvoice,
} from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// POS Checkout & Sales Logs
router.route('/sales')
  .get(getSalesList)
  .post(createSale);

// Invoices history query APIs
router.route('/invoices')
  .get(getInvoices);

router.route('/invoices/:invoiceNumber')
  .get(getInvoiceDetails)
  .put(updateInvoice);

export default router;
