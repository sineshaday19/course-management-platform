const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: `${error.path} already exists`,
      value: error.value
    }));

    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Custom validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: err.message || 'Resource not found'
    });
  }

  // Authorization errors
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: err.message || 'Access denied'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

module.exports = {
  errorHandler,
  ValidationError,
  NotFoundError,
  AuthorizationError
}; 