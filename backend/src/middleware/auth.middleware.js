/**
 * JWT Authentication Middleware
 * Verifies access token from Authorization header
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return ApiResponse.error(res, 'User not found.', 401);
    }

    if (user.isBanned) {
      return ApiResponse.error(res, 'Your account has been suspended.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired. Please refresh.', 401);
    }
    return ApiResponse.error(res, 'Invalid token.', 401);
  }
});

// Optional auth — attaches user if token present but doesn't block
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
});

module.exports = { protect, optionalAuth };
