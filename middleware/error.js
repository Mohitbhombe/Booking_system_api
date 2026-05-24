const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack || err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with ID of ${err.value}`;
    error = { status: 400, message };
  }

  // Mongoose duplicate key (11000)
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    if (err.keyValue) {
      const keys = Object.keys(err.keyValue).join(', ');
      const values = Object.values(err.keyValue).join(', ');
      message = `Duplicate entry for ${keys}: '${values}'. Please use another value.`;
    }
    error = { status: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { status: 400, message };
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
