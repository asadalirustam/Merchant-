import ActivityLog from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// @desc    Get activity logs (paginated)
// @route   GET /api/activity-logs
// @access  Private (CEO Only)
export const getActivityLogs = async (req, res) => {
  const { page = 1, limit = 100, action, user } = req.query;

  try {
    const query = {};

    if (action) {
      query.action = action;
    }

    if (user) {
      query.user = user;
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort('-timestamp')
      .skip(skipIndex)
      .limit(parseInt(limit));

    return sendSuccess(res, 'Activity logs retrieved successfully', {
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch activity logs', error, 500);
  }
};
