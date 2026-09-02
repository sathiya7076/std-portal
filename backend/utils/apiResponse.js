/**
 * Standardized success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} data
 * @param {object} [meta] optional pagination/meta info
 */
const sendSuccess = (res, statusCode, message, data = {}, meta = undefined) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Standardized error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [errors] optional validation error details
 */
const sendError = (res, statusCode, message, errors = undefined) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
