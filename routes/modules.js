const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Module } = require('../models');
const { authorizeManager } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /modules:
 *   get:
 *     summary: Get all modules with filtering
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: half
 *         schema:
 *           type: string
 *           enum: [H1, H2]
 *         description: Filter by half
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Modules retrieved successfully
 */
router.get('/', [
  query('half').optional().isIn(['H1', 'H2']),
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

    const { half, isActive, page = 1, limit = 10 } = req.query;

    // Build where clause
    const whereClause = {};
    if (half) whereClause.half = half;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (page - 1) * limit;

    const modules = await Module.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        modules: modules.rows,
        pagination: {
          total: modules.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(modules.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /modules/{id}:
 *   get:
 *     summary: Get a specific module
 *     tags: [Modules]
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
 *         description: Module retrieved successfully
 *       404:
 *         description: Module not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findByPk(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.json({
      success: true,
      data: { module }
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /modules:
 *   post:
 *     summary: Create a new module (Managers only)
 *     tags: [Modules]
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
 *               - code
 *               - half
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               code:
 *                 type: string
 *                 minLength: 2
 *               description:
 *                 type: string
 *               half:
 *                 type: string
 *                 enum: [H1, H2]
 *               credits:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('name').isLength({ min: 2, max: 255 }).trim(),
  body('code').isLength({ min: 2, max: 50 }).trim(),
  body('description').optional().isString(),
  body('half').isIn(['H1', 'H2']),
  body('credits').optional().isInt({ min: 0, max: 30 })
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

    const { name, code, description, half, credits = 0 } = req.body;

    // Check if module with same code already exists
    const existingModule = await Module.findOne({
      where: { code, isActive: true }
    });

    if (existingModule) {
      return res.status(409).json({
        success: false,
        message: 'Module with this code already exists'
      });
    }

    const module = await Module.create({
      name,
      code,
      description,
      half,
      credits
    });

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: { module }
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /modules/{id}:
 *   put:
 *     summary: Update a module (Managers only)
 *     tags: [Modules]
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
 *               code:
 *                 type: string
 *                 minLength: 2
 *               description:
 *                 type: string
 *               half:
 *                 type: string
 *                 enum: [H1, H2]
 *               credits:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       404:
 *         description: Module not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('name').optional().isLength({ min: 2, max: 255 }).trim(),
  body('code').optional().isLength({ min: 2, max: 50 }).trim(),
  body('description').optional().isString(),
  body('half').optional().isIn(['H1', 'H2']),
  body('credits').optional().isInt({ min: 0, max: 30 }),
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

    const module = await Module.findOne({
      where: { id, isActive: true }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if code is being updated and if it already exists
    if (updateData.code && updateData.code !== module.code) {
      const existingModule = await Module.findOne({
        where: { code: updateData.code, isActive: true }
      });

      if (existingModule) {
        return res.status(409).json({
          success: false,
          message: 'Module with this code already exists'
        });
      }
    }

    await module.update(updateData);

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: { module }
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /modules/{id}:
 *   delete:
 *     summary: Delete a module (Managers only)
 *     tags: [Modules]
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
 *         description: Module deleted successfully
 *       404:
 *         description: Module not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findOne({
      where: { id, isActive: true }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Soft delete
    await module.update({ isActive: false });

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 