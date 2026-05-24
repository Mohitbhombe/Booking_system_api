const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');
const { isTokenBlacklisted } = require('../utils/tokenBlacklist');

/**
 * Protect routes — verify JWT and attach user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Not authorized — no token provided');
    }

    if (isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Token has been revoked. Please log in again');
    }

    if (!process.env.JWT_SECRET) {
      throw new UnauthorizedError('JWT_SECRET is not configured on the server');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      throw new UnauthorizedError('User belonging to this token no longer exists');
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Not authorized — invalid or expired token'));
    }
    next(error);
  }
};

module.exports = protect;
