const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Facilitator, Manager } = require('../models');
const { authorizeManager } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /facilitators:
 *   get:
 *     summary: Get all facilitators with filtering
 *     tags: [Facilitators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *         description: Filter by manager ID
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Facilitators retrieved successfully
 */
router.get('/', [
  query('managerId').optional().isUUID(),
  query('location').optional().isString(),
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

    const { managerId, location, isActive, page = 1, limit = 10 } = req.query;

    // Build where clause
    const whereClause = {};
    if (managerId) whereClause.managerId = managerId;
    if (location) whereClause.location = location;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const facilitators = await Facilitator.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Manager,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        facilitators: facilitators.rows,
        pagination: {
          total: facilitators.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(facilitators.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get facilitators error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /facilitators/{id}:
 *   get:
 *     summary: Get a specific facilitator
 *     tags: [Facilitators]
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
 *         description: Facilitator retrieved successfully
 *       404:
 *         description: Facilitator not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const facilitator = await Facilitator.findByPk(id, {
      include: [
        {
          model: Manager,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!facilitator) {
      return res.status(404).json({
        success: false,
        message: 'Facilitator not found'
      });
    }

    res.json({
      success: true,
      data: { facilitator }
    });
  } catch (error) {
    console.error('Get facilitator error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /facilitators:
 *   post:
 *     summary: Create a new facilitator (Managers only)
 *     tags: [Facilitators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *               - qualification
 *               - location
 *               - managerId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 2
 *               password:
 *                 type: string
 *                 minLength: 6
 *               qualification:
 *                 type: string
 *                 minLength: 2
 *               location:
 *                 type: string
 *                 minLength: 2
 *               managerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Facilitator created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('password').isLength({ min: 6 }),
  body('qualification').isLength({ min: 2, max: 100 }).trim(),
  body('location').isLength({ min: 2, max: 100 }).trim(),
  body('managerId').isUUID()
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

    const { email, name, password, qualification, location, managerId } = req.body;

    // Check if facilitator with same email already exists
    const existingFacilitator = await Facilitator.findOne({
      where: { email, isActive: true }
    });

    if (existingFacilitator) {
      return res.status(409).json({
        success: false,
        message: 'Facilitator with this email already exists'
      });
    }

    // Verify manager exists
    const manager = await Manager.findByPk(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    const facilitator = await Facilitator.create({
      email,
      name,
      password,
      qualification,
      location,
      managerId
    });

    // Fetch the created facilitator with related data
    const createdFacilitator = await Facilitator.findByPk(facilitator.id, {
      include: [
        {
          model: Manager,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Facilitator created successfully',
      data: { facilitator: createdFacilitator }
    });
  } catch (error) {
    console.error('Create facilitator error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /facilitators/{id}:
 *   put:
 *     summary: Update a facilitator (Managers only)
 *     tags: [Facilitators]
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
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 2
 *               password:
 *                 type: string
 *                 minLength: 6
 *               qualification:
 *                 type: string
 *                 minLength: 2
 *               location:
 *                 type: string
 *                 minLength: 2
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Facilitator updated successfully
 *       404:
 *         description: Facilitator not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('password').optional().isLength({ min: 6 }),
  body('qualification').optional().isLength({ min: 2, max: 100 }).trim(),
  body('location').optional().isLength({ min: 2, max: 100 }).trim(),
  body('managerId').optional().isUUID(),
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

    const facilitator = await Facilitator.findOne({
      where: { id, isActive: true }
    });

    if (!facilitator) {
      return res.status(404).json({
        success: false,
        message: 'Facilitator not found'
      });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== facilitator.email) {
      const existingFacilitator = await Facilitator.findOne({
        where: { email: updateData.email, isActive: true }
      });

      if (existingFacilitator) {
        return res.status(409).json({
          success: false,
          message: 'Facilitator with this email already exists'
        });
      }
    }

    // Verify manager exists if managerId is being updated
    if (updateData.managerId) {
      const manager = await Manager.findByPk(updateData.managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    await facilitator.update(updateData);

    // Fetch updated facilitator with related data
    const updatedFacilitator = await Facilitator.findByPk(id, {
      include: [
        {
          model: Manager,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Facilitator updated successfully',
      data: { facilitator: updatedFacilitator }
    });
  } catch (error) {
    console.error('Update facilitator error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /facilitators/{id}:
 *   delete:
 *     summary: Delete a facilitator (Managers only)
 *     tags: [Facilitators]
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
 *         description: Facilitator deleted successfully
 *       404:
 *         description: Facilitator not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const facilitator = await Facilitator.findOne({
      where: { id, isActive: true }
    });

    if (!facilitator) {
      return res.status(404).json({
        success: false,
        message: 'Facilitator not found'
      });
    }

    // Soft delete
    await facilitator.update({ isActive: false });

    res.json({
      success: true,
      message: 'Facilitator deleted successfully'
    });
  } catch (error) {
    console.error('Delete facilitator error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 