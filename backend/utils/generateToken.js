const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a given user id/role.
 * @param {string} id Mongo document _id of the user
 * @param {string} role 'student' | 'trainer'
 * @returns {string} signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
