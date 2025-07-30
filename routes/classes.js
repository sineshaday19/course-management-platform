const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Class } = require('../models');
const { authorizeManager } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes with filtering
 *     tags: [Classes]
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
 *         description: Classes retrieved successfully
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

    const classes = await Class.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        classes: classes.rows,
        pagination: {
          total: classes.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(classes.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a specific class
 *     tags: [Classes]
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
 *         description: Class retrieved successfully
 *       404:
 *         description: Class not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: { class: classItem }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class (Managers only)
 *     tags: [Classes]
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
 *               - startDate
 *               - graduationDate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               startDate:
 *                 type: string
 *                 format: date
 *               graduationDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('name').isLength({ min: 2, max: 50 }).trim(),
  body('startDate').isISO8601(),
  body('graduationDate').isISO8601()
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

    const { name, startDate, graduationDate } = req.body;

    // Check if class with same name already exists
    const existingClass = await Class.findOne({
      where: { name, isActive: true }
    });

    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: 'Class with this name already exists'
      });
    }

    const classItem = await Class.create({
      name,
      startDate,
      graduationDate
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: classItem }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class (Managers only)
 *     tags: [Classes]
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               graduationDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('startDate').optional().isISO8601(),
  body('graduationDate').optional().isISO8601(),
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

    const classItem = await Class.findOne({
      where: { id, isActive: true }
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if name is being updated and if it already exists
    if (updateData.name && updateData.name !== classItem.name) {
      const existingClass = await Class.findOne({
        where: { name: updateData.name, isActive: true }
      });

      if (existingClass) {
        return res.status(409).json({
          success: false,
          message: 'Class with this name already exists'
        });
      }
    }

    await classItem.update(updateData);

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: { class: classItem }
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class (Managers only)
 *     tags: [Classes]
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
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findOne({
      where: { id, isActive: true }
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Soft delete
    await classItem.update({ isActive: false });

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 