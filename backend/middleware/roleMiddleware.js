const ApiError = require("../utils/ApiError");

/**
 * Reusable role-checker middleware factory.
 * Usage: requireRole("trainer") or requireRole("trainer", "student")
 * Must run AFTER `protect` so req.user is populated.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Not authorized, no user context found");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Requires role: ${allowedRoles.join(" or ")}`
      );
    }
    next();
  };
};

module.exports = { requireRole };
