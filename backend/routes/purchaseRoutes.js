import express from 'express';
import {
  getPurchases,
  createPurchase,
  receiveStock,
  deletePurchase,
} from '../controllers/purchaseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('CEO', 'Admin'));

router.route('/')
  .get(getPurchases)
  .post(createPurchase);

router.patch('/:id/receive', receiveStock);
router.delete('/:id', deletePurchase);

export default router;
