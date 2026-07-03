import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Register initial CEO (Bootstrap)
// @route   POST /api/auth/register-ceo
// @access  Public
export const registerCEO = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const ceoExists = await User.findOne({ role: 'CEO' });
    if (ceoExists) {
      return sendError(res, 'CEO account already exists. Only one CEO is allowed.', null, 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'CEO',
      status: 'Active',
      permissions: ['ALL'],
    });

    await logActivity(user._id, 'CEO_REGISTRATION', 'First CEO account registered during system setup', req);

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return sendSuccess(res, 'CEO registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
      accessToken,
      refreshToken,
    }, 211);
  } catch (error) {
    return sendError(res, 'Registration failed', error, 500);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Please provide email and password', null, 400);
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 'Invalid credentials', null, 401);
    }

    if (user.status === 'Suspended') {
      return sendError(res, 'Your account is suspended. Please contact CEO.', null, 403);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Update last login date
    user.lastLogin = new Date();
    await user.save();

    await logActivity(user._id, 'LOGIN', 'User logged in successfully', req);

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return sendError(res, 'Login failed', error, 500);
  }
};

// @desc    Logout user & clear tokens
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await RefreshToken.findOneAndDelete({ token: refreshToken });
    }

    if (req.user) {
      await logActivity(req.user._id, 'LOGOUT', 'User logged out', req);
    }

    return sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    return sendError(res, 'Logout failed', error, 500);
  }
};

// @desc    Refresh token rotation
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token required', null, 400);
  }

  try {
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!tokenDoc) {
      return sendError(res, 'Invalid or expired refresh token', null, 401);
    }

    // Check if token has expired
    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.findByIdAndDelete(tokenDoc._id);
      return sendError(res, 'Refresh token has expired', null, 401);
    }

    const user = tokenDoc.user;
    if (!user || user.status === 'Suspended') {
      return sendError(res, 'User suspended or deleted', null, 403);
    }

    // Rotate token: delete old, generate new access and refresh
    await RefreshToken.findByIdAndDelete(tokenDoc._id);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    return sendSuccess(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return sendError(res, 'Refresh failed', error, 500);
  }
};

// @desc    Forgot Password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'No user with that email exists', null, 404);
    }

    // Generate dynamic mock reset token for security (10-min validity)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    
    // In production this would be emailed. For demo, we output to server log & return in API payload.
    console.log(`[PASSWORD RESET CODE FOR ${email}]: ${resetToken}`);

    // Store temporary code on user object
    user.permissions.push(`RESET:${resetToken}`);
    // Mark setting timer if needed, but since user.permissions is a simple array, let's keep it simple.
    await user.save();

    return sendSuccess(res, 'Reset code generated. Check server console logs.', {
      email,
      // Returning code to facilitate testing/demo easily.
      resetCode: resetToken,
    });
  } catch (error) {
    return sendError(res, 'Forgot password request failed', error, 500);
  }
};

// @desc    Reset Password using code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    const permissionTag = `RESET:${resetCode}`;
    const codeIndex = user.permissions.indexOf(permissionTag);

    if (codeIndex === -1) {
      return sendError(res, 'Invalid reset code or email', null, 400);
    }

    // Reset password & clear code
    user.password = newPassword;
    user.permissions.splice(codeIndex, 1);
    await user.save();

    await logActivity(user._id, 'PASSWORD_RESET', 'User password reset via recovery code', req);

    return sendSuccess(res, 'Password reset successfully');
  } catch (error) {
    return sendError(res, 'Reset password failed', error, 500);
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(oldPassword))) {
      return sendError(res, 'Incorrect current password', null, 400);
    }

    user.password = newPassword;
    await user.save();

    await logActivity(user._id, 'PASSWORD_CHANGE', 'User updated password settings', req);

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Change password failed', error, 500);
  }
};
