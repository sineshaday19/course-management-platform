const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Cohort } = require('../models');
const { ValidationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /cohorts:
 *   get:
 *     summary: Get all cohorts
 *     tags: [Cohorts]
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
 *         name: intakePeriod
 *         schema:
 *           type: string
 *           enum: [HT1, HT2, FT]
 *         description: Filter by intake period
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of cohorts
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
 *                     cohorts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cohort'
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
  query('intakePeriod').optional().isIn(['HT1', 'HT2', 'FT']),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const {
      page = 1,
      limit = 10,
      search,
      intakePeriod,
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

    if (intakePeriod) {
      where.intakePeriod = intakePeriod;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const { count, rows: cohorts } = await Cohort.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Cohorts retrieved successfully',
      data: {
        cohorts,
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
 * /cohorts/{id}:
 *   get:
 *     summary: Get cohort by ID
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cohort ID
 *     responses:
 *       200:
 *         description: Cohort details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cohort'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Cohort not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid cohort ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { id } = req.params;

    const cohort = await Cohort.findByPk(id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cohort retrieved successfully',
      data: { cohort }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /cohorts:
 *   post:
 *     summary: Create a new cohort
 *     tags: [Cohorts]
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
 *               - intakePeriod
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               intakePeriod:
 *                 type: string
 *                 enum: [HT1, HT2, FT]
 *     responses:
 *       201:
 *         description: Cohort created successfully
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
 *                   $ref: '#/components/schemas/Cohort'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('intakePeriod')
    .isIn(['HT1', 'HT2', 'FT'])
    .withMessage('Intake period must be HT1, HT2, or FT')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { name, description, intakePeriod } = req.body;

    const existingCohort = await Cohort.findOne({
      where: { name }
    });

    if (existingCohort) {
      return res.status(400).json({
        success: false,
        message: 'Cohort with this name already exists'
      });
    }

    const cohort = await Cohort.create({
      name,
      description,
      intakePeriod
    });

    res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      data: { cohort }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /cohorts/{id}:
 *   put:
 *     summary: Update cohort
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cohort ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               intakePeriod:
 *                 type: string
 *                 enum: [HT1, HT2, FT]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cohort updated successfully
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
 *                   $ref: '#/components/schemas/Cohort'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Cohort not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid cohort ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('intakePeriod')
    .optional()
    .isIn(['HT1', 'HT2', 'FT'])
    .withMessage('Intake period must be HT1, HT2, or FT'),
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

    const cohort = await Cohort.findByPk(id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    if (updateData.name && updateData.name !== cohort.name) {
      const existingCohort = await Cohort.findOne({
        where: { name: updateData.name }
      });

      if (existingCohort) {
        return res.status(400).json({
          success: false,
          message: 'Cohort with this name already exists'
        });
      }
    }

    await cohort.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Cohort updated successfully',
      data: { cohort }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /cohorts/{id}:
 *   delete:
 *     summary: Delete cohort
 *     tags: [Cohorts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cohort ID
 *     responses:
 *       200:
 *         description: Cohort deleted successfully
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
 *         description: Cohort not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid cohort ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { id } = req.params;

    const cohort = await Cohort.findByPk(id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found'
      });
    }

    await cohort.destroy();

    res.status(200).json({
      success: true,
      message: 'Cohort deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 