import { sendError } from '../utils/apiResponse.js';

// Restrict to specific roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Role (${req.user.role}) is not authorized to access this resource`,
        null,
        403
      );
    }

    next();
  };
};

// Check if user is CEO or has the required permission
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', null, 401);
    }

    // CEO bypasses all permission checks
    if (req.user.role === 'CEO') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return sendError(
        res,
        'Access Denied: You do not have the required permission',
        null,
        403
      );
    }

    next();
  };
};
