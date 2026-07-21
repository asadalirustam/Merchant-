import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'merchant_secret_access_key_9988776655'
      );

      // Get user from database (excluding password)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return sendError(res, 'Not authorized, user not found', null, 401);
      }

      if (req.user.status === 'Disabled') {
        return sendError(res, 'Your account has been disabled. Please contact the CEO.', null, 403);
      }

      next();
    } catch (error) {
      console.error(error);
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 'TokenExpiredError', 401);
      }
      return sendError(res, 'Not authorized, token failed', null, 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', null, 401);
  }
};
