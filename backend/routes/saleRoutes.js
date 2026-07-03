import express from 'express';
import {
  getSales,
  getSaleByInvoice,
  createSale,
  deleteSale,
} from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('CEO', 'Admin'));

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:invoiceNumber')
  .get(getSaleByInvoice);

router.route('/:id')
  .delete(deleteSale);

export default router;
