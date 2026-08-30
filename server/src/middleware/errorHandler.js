/**
 * Translate known error types into a status code + message. Anything not
 * recognized falls through as a 500 so we never leak internal error text to
 * the client in production.
 */
const normalizeError = (err) => {
  if (typeof err.statusCode === 'number') {
    return { statusCode: err.statusCode, message: err.message, details: err.details };
  }

  // Mongoose validation error - collect a message per invalid field.
  if (err.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    return { statusCode: 400, message: 'Validation failed', details };
  }

  // Mongoose duplicate key error.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return { statusCode: 409, message: `${field} is already in use` };
  }

  // Mongoose bad ObjectId cast.
  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid value for ${err.path}` };
  }

  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token has expired' };
  }

  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }

  return { statusCode: 500, message: 'Internal Server Error' };
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  const { statusCode, message, details } = normalizeError(err);

  if (statusCode >= 500) {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined && { errors: details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export { errorHandler, notFound };
