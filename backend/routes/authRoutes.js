import express from 'express';
import {
  registerCEO,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register-ceo', registerCEO);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, upload.single('profileImage'), updateProfile);

export default router;
