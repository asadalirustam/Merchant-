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
      status: 'Enabled',
    });

    await logActivity(user._id, 'Login', 'CEO registered & logged in during setup', req);

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return sendSuccess(res, 'CEO registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    }, 211);
  } catch (error) {
    console.error('CEO Bootstrap Error:', error);
    return sendError(res, error.message || 'Registration failed', error, 500);
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
      await logActivity(null, 'Login Failed', `Failed login attempt for email: ${email}`, req);
      return sendError(res, 'Invalid credentials', null, 401);
    }

    if (user.status === 'Disabled') {
      await logActivity(user._id, 'Login Failed', `Attempted login on disabled account: ${email}`, req);
      return sendError(res, 'Your account is disabled. Please contact the CEO.', null, 403);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Update last login date
    user.lastLogin = new Date();
    await user.save();

    await logActivity(user._id, 'Login', 'User logged in successfully', req);

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
      await logActivity(req.user._id, 'Logout', 'User logged out', req);
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
    if (!user || user.status === 'Disabled') {
      return sendError(res, 'User disabled or deleted', null, 403);
    }

    // Rotate token
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

    await logActivity(user._id, 'Password Changed', 'User updated password settings', req);

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Change password failed', error, 500);
  }
};

// @desc    Forgot password - generate reset code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Please provide email', null, 400);
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User with that email does not exist', null, 404);
    }

    // Generate random 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    await user.save();

    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET CODE] for \${email}: \${resetCode}`);
    console.log(`======================================================\n`);

    return sendSuccess(res, 'Password reset code generated successfully', { resetCode });
  } catch (error) {
    return sendError(res, 'Forgot password failed', error, 500);
  }
};

// @desc    Reset password using reset code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return sendError(res, 'Please provide email, resetCode and newPassword', null, 400);
  }

  if (newPassword.length < 6) {
    return sendError(res, 'Password must be at least 6 characters', null, 400);
  }

  try {
    const user = await User.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 'Invalid or expired password reset code', null, 400);
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    await logActivity(user._id, 'Password Reset', `User reset password successfully via email reset code`, req);

    return sendSuccess(res, 'Password reset successfully. You can now log in.');
  } catch (error) {
    return sendError(res, 'Reset password failed', error, 500);
  }
};

// @desc    Update user profile (name, profileImage)
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }

    if (name) {
      user.name = name;
    }

    if (req.file) {
      // Save local path for avatar upload
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    await logActivity(user._id, 'Profile Updated', 'User updated profile details', req);

    return sendSuccess(res, 'Profile updated successfully', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return sendError(res, 'Profile update failed', error, 500);
  }
};
