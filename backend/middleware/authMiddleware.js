const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

/**
 * Verifies the JWT sent in the Authorization header (Bearer token),
 * loads the corresponding user, and attaches it to req.user.
 * Rejects the request if the token is missing, invalid, expired,
 * or the user account has been deactivated.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, "Not authorized, token invalid or expired");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  // ADDED: trainer must be approved by admin (also blocks old tokens
  // if admin rejects a trainer later)
  if (
    user.role === "trainer" &&
    (user.approvalStatus === "pending" || user.approvalStatus === "rejected")
  ) {
    throw new ApiError(403, "Your trainer account is not approved by admin");
  }

  req.user = user; // full user doc (password excluded by schema)
  next();
});

/**
 * ADDED: role guard. Use after `protect`.
 * Example: router.use(protect, authorize("admin"));
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission for this action");
  }
  next();
};

module.exports = { protect, authorize };