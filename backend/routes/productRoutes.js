import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('CEO', 'Admin'));

router.route('/')
  .get(getProducts)
  .post(upload.single('productImage'), createProduct);

router.route('/:id')
  .put(upload.single('productImage'), updateProduct)
  .delete(deleteProduct);

router.get('/info/:idOrCode', getProductById);
router.patch('/:id/adjust', adjustProduct);

export default router;
