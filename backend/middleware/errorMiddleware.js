const multer = require("multer");

/**
 * Centralized error handler. Normalizes Mongoose, Multer, JWT,
 * and custom ApiError instances into the consistent response shape:
 * { success: false, message, errors? }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.message || "Internal Server Error";
  let errors;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = "Validation failed";
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(", ");
    message = `Duplicate value for field: ${field}`;
  }

  // Multer errors (file size, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.message;
  }

  // JWT errors (fallback, though authMiddleware already handles most)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;

  res.status(statusCode).json(payload);
};

module.exports = { errorHandler };
