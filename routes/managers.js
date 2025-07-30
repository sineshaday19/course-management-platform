const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Manager, Facilitator } = require('../models');
const { authorizeManager } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /managers:
 *   get:
 *     summary: Get all managers with filtering
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 */
router.get('/', [
  query('isActive').optional().isBoolean()
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

    const { isActive, page = 1, limit = 10 } = req.query;

    // Build where clause
    const whereClause = {};
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const managers = await Manager.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Facilitator,
          as: 'facilitators',
          attributes: ['id', 'name', 'email', 'location'],
          where: { isActive: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        managers: managers.rows,
        pagination: {
          total: managers.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(managers.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /managers/{id}:
 *   get:
 *     summary: Get a specific manager
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager retrieved successfully
 *       404:
 *         description: Manager not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await Manager.findByPk(id, {
      include: [
        {
          model: Facilitator,
          as: 'facilitators',
          attributes: ['id', 'name', 'email', 'qualification', 'location'],
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    res.json({
      success: true,
      data: { manager }
    });
  } catch (error) {
    console.error('Get manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /managers:
 *   post:
 *     summary: Create a new manager (Managers only)
 *     tags: [Managers]
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
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
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

    const { name, email, password } = req.body;

    // Check if manager with same email already exists
    const existingManager = await Manager.findOne({
      where: { email, isActive: true }
    });

    if (existingManager) {
      return res.status(409).json({
        success: false,
        message: 'Manager with this email already exists'
      });
    }

    const manager = await Manager.create({
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Manager created successfully',
      data: { manager }
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
 * /managers/{id}:
 *   put:
 *     summary: Update a manager (Managers only)
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Manager updated successfully
 *       404:
 *         description: Manager not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('isActive').optional().isBoolean()
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

    const { id } = req.params;
    const updateData = req.body;

    const manager = await Manager.findOne({
      where: { id, isActive: true }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== manager.email) {
      const existingManager = await Manager.findOne({
        where: { email: updateData.email, isActive: true }
      });

      if (existingManager) {
        return res.status(409).json({
          success: false,
          message: 'Manager with this email already exists'
        });
      }
    }

    await manager.update(updateData);

    res.json({
      success: true,
      message: 'Manager updated successfully',
      data: { manager }
    });
  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /managers/{id}:
 *   delete:
 *     summary: Delete a manager (Managers only)
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager deleted successfully
 *       404:
 *         description: Manager not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const manager = await Manager.findOne({
      where: { id, isActive: true }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if manager has facilitators
    const facilitatorCount = await Facilitator.count({
      where: { managerId: id, isActive: true }
    });

    if (facilitatorCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete manager with assigned facilitators'
      });
    }

    // Soft delete
    await manager.update({ isActive: false });

    res.json({
      success: true,
      message: 'Manager deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 