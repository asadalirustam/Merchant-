import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Create new Admin
// @route   POST /api/admins
// @access  Private (CEO Only)
export const createAdmin = async (req, res) => {
  const { name, email, password, permissions } = req.body;

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
      status: 'Active',
      permissions: permissions || [],
    });

    await logActivity(
      req.user._id,
      'ADMIN_CREATE',
      `Admin created: ${newAdmin.name} (${newAdmin.email})`,
      req
    );

    return sendSuccess(res, 'Admin created successfully', {
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        permissions: newAdmin.permissions,
      },
    }, 201);
  } catch (error) {
    return sendError(res, 'Failed to create Admin', error, 500);
  }
};

// @desc    Get all Admins
// @route   GET /api/admins
// @access  Private (CEO Only)
export const getAdmins = async (req, res) => {
  try {
    // Only get Admins, exclude CEO accounts
    const admins = await User.find({ role: 'Admin' }).sort('-createdAt');
    return sendSuccess(res, 'Admins retrieved successfully', admins);
  } catch (error) {
    return sendError(res, 'Failed to fetch Admins', error, 500);
  }
};

// @desc    Update Admin profile/permissions
// @route   PUT /api/admins/:id
// @access  Private (CEO Only)
export const updateAdmin = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin not found', null, 404);
    }

    if (name) admin.name = name;
    if (permissions) admin.permissions = permissions;

    await admin.save();

    await logActivity(
      req.user._id,
      'ADMIN_UPDATE',
      `Admin updated: ${admin.name} permissions: [${admin.permissions.join(', ')}]`,
      req
    );

    return sendSuccess(res, 'Admin updated successfully', admin);
  } catch (error) {
    return sendError(res, 'Failed to update Admin', error, 500);
  }
};

// @desc    Toggle Admin Status (Suspend/Activate)
// @route   PATCH /api/admins/:id/toggle-status
// @access  Private (CEO Only)
export const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'Admin') {
      return sendError(res, 'Admin not found', null, 404);
    }

    admin.status = admin.status === 'Active' ? 'Suspended' : 'Active';
    await admin.save();

    await logActivity(
      req.user._id,
      admin.status === 'Active' ? 'ADMIN_ACTIVATE' : 'ADMIN_SUSPEND',
      `Admin status toggled to ${admin.status}: ${admin.name}`,
      req
    );

    return sendSuccess(res, `Admin ${admin.status === 'Active' ? 'activated' : 'suspended'} successfully`, admin);
  } catch (error) {
    return sendError(res, 'Failed to toggle Admin status', error, 500);
  }
};

// @desc    Reset Admin Password by CEO
// @route   PUT /api/admins/:id/reset-password
// @access  Private (CEO Only)
export const resetAdminPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return sendError(res, 'Password must be at least 6 characters long', null, 400);
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
      'ADMIN_PASSWORD_RESET',
      `CEO reset password for admin: ${admin.name}`,
      req
    );

    return sendSuccess(res, 'Admin password reset successfully');
  } catch (error) {
    return sendError(res, 'Failed to reset Admin password', error, 500);
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
      'ADMIN_DELETE',
      `Admin account deleted: ${admin.name} (${admin.email})`,
      req
    );

    return sendSuccess(res, 'Admin deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete Admin', error, 500);
  }
};
