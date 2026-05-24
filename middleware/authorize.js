const { ForbiddenError } = require('../utils/errors');

/**
 * Restrict route access to specific roles.
 * Must be used after the protect middleware.
 *
 * @example router.post('/', protect, authorize('admin'), createHotel);
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('User not authenticated'));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new ForbiddenError(`Role '${req.user.role}' is not authorized to access this route`)
    );
  }

  next();
};

module.exports = authorize;
