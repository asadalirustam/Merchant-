import express from 'express';
import {
  createAdmin,
  getAdmins,
  updateAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  deleteAdmin,
  getAdminActivity,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All admin management routes require user to be authenticated and have the 'CEO' role
router.use(protect);
router.use(authorizeRoles('CEO'));

router.route('/')
  .get(getAdmins)
  .post(createAdmin);

router.route('/:id')
  .put(updateAdmin)
  .delete(deleteAdmin);

router.patch('/:id/toggle-status', toggleAdminStatus);
router.put('/:id/reset-password', resetAdminPassword);
router.get('/:id/activity', getAdminActivity);

export default router;
