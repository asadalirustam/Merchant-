import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, details, req = null) => {
  try {
    let ipAddress = '0.0.0.0';
    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || ipAddress;
    }

    await ActivityLog.create({
      user: userId,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
