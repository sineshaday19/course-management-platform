const { validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  
  next();
};

module.exports = {
  validateRequest
}; 