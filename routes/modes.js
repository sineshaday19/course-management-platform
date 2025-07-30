const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Mode } = require('../models');
const { ValidationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /modes:
 *   get:
 *     summary: Get all delivery modes
 *     tags: [Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of delivery modes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     modes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Mode'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().isLength({ min: 1 }),
  query('isActive').optional().isBoolean()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const {
      page = 1,
      limit = 10,
      search,
      isActive
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const { count, rows: modes } = await Mode.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Delivery modes retrieved successfully',
      data: {
        modes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /modes/{id}:
 *   get:
 *     summary: Get delivery mode by ID
 *     tags: [Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Mode ID
 *     responses:
 *       200:
 *         description: Delivery mode details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Mode'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Mode not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid mode ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { id } = req.params;

    const mode = await Mode.findByPk(id);

    if (!mode) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mode not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery mode retrieved successfully',
      data: { mode }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /modes:
 *   post:
 *     summary: Create a new delivery mode
 *     tags: [Modes]
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
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [online, in-person, hybrid]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Delivery mode created successfully
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
 *                   $ref: '#/components/schemas/Mode'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('name')
    .isIn(['online', 'in-person', 'hybrid'])
    .withMessage('Name must be online, in-person, or hybrid'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { name, description } = req.body;

    const existingMode = await Mode.findOne({
      where: { name }
    });

    if (existingMode) {
      return res.status(400).json({
        success: false,
        message: 'Delivery mode with this name already exists'
      });
    }

    const mode = await Mode.create({
      name,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Delivery mode created successfully',
      data: { mode }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /modes/{id}:
 *   put:
 *     summary: Update delivery mode
 *     tags: [Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Mode ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [online, in-person, hybrid]
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Delivery mode updated successfully
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
 *                   $ref: '#/components/schemas/Mode'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Mode not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid mode ID'),
  body('name')
    .optional()
    .isIn(['online', 'in-person', 'hybrid'])
    .withMessage('Name must be online, in-person, or hybrid'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const mode = await Mode.findByPk(id);

    if (!mode) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mode not found'
      });
    }

    if (updateData.name && updateData.name !== mode.name) {
      const existingMode = await Mode.findOne({
        where: { name: updateData.name }
      });

      if (existingMode) {
        return res.status(400).json({
          success: false,
          message: 'Delivery mode with this name already exists'
        });
      }
    }

    await mode.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Delivery mode updated successfully',
      data: { mode }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /modes/{id}:
 *   delete:
 *     summary: Delete delivery mode
 *     tags: [Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Mode ID
 *     responses:
 *       200:
 *         description: Delivery mode deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Mode not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid mode ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { id } = req.params;

    const mode = await Mode.findByPk(id);

    if (!mode) {
      return res.status(404).json({
        success: false,
        message: 'Delivery mode not found'
      });
    }

    await mode.destroy();

    res.status(200).json({
      success: true,
      message: 'Delivery mode deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 