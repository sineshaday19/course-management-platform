const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Manager, Facilitator } = require('../models');
const { ValidationError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login for managers and facilitators
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [manager, facilitator]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['manager', 'facilitator'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Find user based on role
    let user;
    if (role === 'manager') {
      user = await Manager.findOne({ where: { email } });
    } else if (role === 'facilitator') {
      user = await Facilitator.findOne({ where: { email } });
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token with shorter lifetime
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '3h' }
    );

    // Generate refresh token (optional - for better UX)
    const refreshToken = jwt.sign(
      { 
        id: user.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Refresh tokens last longer
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '3h',
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new manager or facilitator
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [manager, facilitator]
 *               qualification:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', [
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['manager', 'facilitator']),
  body('qualification').optional().isLength({ min: 2, max: 100 }),
  body('location').optional().isLength({ min: 2, max: 100 }),
  body('invitationCode').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, email, password, role, qualification, location, invitationCode } = req.body;

    // Check if user already exists
    let existingUser;
    if (role === 'manager') {
      existingUser = await Manager.findOne({ where: { email } });
    } else if (role === 'facilitator') {
      existingUser = await Facilitator.findOne({ where: { email } });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Role-based registration restrictions
    if (role === 'manager') {
      // Manager registration requires invitation code
      const validInvitationCode = process.env.MANAGER_INVITATION_CODE || 'ADMIN2024';
      if (!invitationCode || invitationCode !== validInvitationCode) {
        return res.status(403).json({
          success: false,
          message: 'Manager registration requires a valid invitation code'
        });
      }
      
      user = await Manager.create({
        name,
        email,
        password
      });
    } else if (role === 'facilitator') {
      // Facilitator registration requires qualification and location
      if (!qualification || !location) {
        return res.status(400).json({
          success: false,
          message: 'Qualification and location are required for facilitators'
        });
      }
      
      // Check if there are any existing managers to assign to
      const existingManagers = await Manager.count();
      if (existingManagers === 0) {
        return res.status(403).json({
          success: false,
          message: 'No managers available. Please contact system administrator.'
        });
      }
      
      // Assign to the first available manager (you can modify this logic)
      const firstManager = await Manager.findOne();
      
      user = await Facilitator.create({
        name,
        email,
        password,
        qualification,
        location,
        managerId: firstManager.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', async (req, res) => {
  try {
    // This route requires authentication middleware
    // The user will be available in req.user
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /auth/create-manager:
 *   post:
 *     summary: Create a new manager (only existing managers can do this)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Manager created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied - only managers can create managers
 *       409:
 *         description: Email already exists
 */
router.post('/create-manager', [
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check if user is authenticated and is a manager
    if (!req.user || req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers can create other managers.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if manager already exists
    const existingManager = await Manager.findOne({ where: { email } });
    if (existingManager) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new manager
    const newManager = await Manager.create({
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Manager created successfully',
      data: {
        user: newManager.toJSON()
      }
    });
  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user
    let user = await Manager.findByPk(decoded.id);
    if (!user) {
      user = await Facilitator.findByPk(decoded.id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '3h' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '3h'
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 