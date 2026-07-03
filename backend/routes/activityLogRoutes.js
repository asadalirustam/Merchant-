import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('CEO'), getActivityLogs);

export default router;
