const ApiError = require("../utils/ApiError");

/**
 * Catches requests to undefined routes and forwards a 404 ApiError
 * to the centralized error handler.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = { notFound };
