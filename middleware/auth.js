const jwt = require('jsonwebtoken');
const { Manager, Facilitator } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on role
    let user;
    if (decoded.role === 'manager') {
      user = await Manager.findByPk(decoded.id);
    } else if (decoded.role === 'facilitator') {
      user = await Facilitator.findByPk(decoded.id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const authorizeManager = (req, res, next) => {
  if (req.userRole !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Manager role required.'
    });
  }
  next();
};

const authorizeFacilitator = (req, res, next) => {
  if (req.userRole !== 'facilitator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Facilitator role required.'
    });
  }
  next();
};

const authorizeManagerOrSelf = (req, res, next) => {
  if (req.userRole === 'manager') {
    return next();
  }
  
  if (req.userRole === 'facilitator' && req.user.id === req.params.id) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Access denied. Manager role or own resource access required.'
  });
};

module.exports = {
  authenticateToken,
  authorizeManager,
  authorizeFacilitator,
  authorizeManagerOrSelf
}; 