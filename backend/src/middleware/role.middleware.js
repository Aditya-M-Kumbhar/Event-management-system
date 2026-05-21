/**
 * Role-Based Access Control Middleware
 * Usage: authorize('admin', 'organiser')
 */

const ApiResponse = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Role '${req.user.role}' is not authorized for this action.`,
        403
      );
    }

    next();
  };
};

module.exports = { authorize };
