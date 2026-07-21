import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Create new Admin
// @route   POST /api/admins
// @access  Private (CEO Only)
export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return sendError(res, 'User with that email already exists', null, 400);
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: 'Admin',
      status: 'Enabled',
    });

    await logActivity(
      req.user._id,
      'Admin Created',
      `CEO created admin: ${newAdmin.name} (${newAdmin.email})`,
      req
    );

    return sendSuccess(res, 'Admin profile created successfully', {
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
      },
    }, 201);
  } catch (error) {
    return sendError(res, 'Failed to create Admin account', error, 500);
  }
};

// @desc    Get all Admins
// @route   GET /api/admins
// @access  Private (CEO Only)
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'Admin' }).sort('-createdAt');
    return sendSuccess(res, 'Admins retrieved successfully', admins);
  } catch (error) {
    return sendError(res, 'Failed to fetch Admins list', error, 500);
  }
};

// @desc    Update Admin profile
// @route   PUT /api/admins/:id
// @access  Private (CEO Only)
export const updateAdmin = async (req, res) => {
  const { name } = req.body;

  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin not found', null, 404);
    }

    if (name) admin.name = name;
    await admin.save();

    await logActivity(
      req.user._id,
      'Admin Updated',
      `CEO updated admin name to: ${admin.name}`,
      req
    );

    return sendSuccess(res, 'Admin profile updated successfully', admin);
  } catch (error) {
    return sendError(res, 'Failed to update Admin details', error, 500);
  }
};

// @desc    Toggle Admin Status (Enable/Disable)
// @route   PATCH /api/admins/:id/toggle-status
// @access  Private (CEO Only)
export const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin profile not found', null, 404);
    }

    admin.status = admin.status === 'Enabled' ? 'Disabled' : 'Enabled';
    await admin.save();

    await logActivity(
      req.user._id,
      admin.status === 'Enabled' ? 'Admin Enabled' : 'Admin Disabled',
      `CEO toggled status of admin (${admin.name}) to: ${admin.status}`,
      req
    );

    return sendSuccess(res, `Admin account is now ${admin.status}`, admin);
  } catch (error) {
    return sendError(res, 'Failed to toggle status', error, 500);
  }
};

// @desc    Reset Admin Password directly
// @route   PUT /api/admins/:id/reset-password
// @access  Private (CEO Only)
export const resetAdminPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return sendError(res, 'Password must be at least 6 characters', null, 400);
  }

  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin not found', null, 404);
    }

    admin.password = newPassword;
    await admin.save();

    await logActivity(
      req.user._id,
      'Password Changed',
      `CEO reset password for admin: ${admin.name}`,
      req
    );

    return sendSuccess(res, 'Admin password updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to reset Admin credentials', error, 500);
  }
};

// @desc    Get specific Admin activity history logs
// @route   GET /api/admins/:id/activity
// @access  Private (CEO Only)
export const getAdminActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.id }).sort('-timestamp');
    return sendSuccess(res, 'Admin activity logs fetched successfully', logs);
  } catch (error) {
    return sendError(res, 'Failed to retrieve admin logs history', error, 500);
  }
};

// @desc    Delete Admin
// @route   DELETE /api/admins/:id
// @access  Private (CEO Only)
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin not found', null, 404);
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'Admin Deleted',
      `CEO deleted admin profile: ${admin.name} (${admin.email})`,
      req
    );

    return sendSuccess(res, 'Admin deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete Admin', error, 500);
  }
};
