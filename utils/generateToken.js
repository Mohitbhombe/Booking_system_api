const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given user ID.
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

module.exports = generateToken;
