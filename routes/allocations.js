const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { CourseAllocation, Module, Class, Facilitator, Mode, Manager, Cohort } = require('../models');
const { authorizeManager, authorizeFacilitator } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /allocations:
 *   get:
 *     summary: Get all course allocations with filtering
 *     tags: [Course Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trimester
 *         schema:
 *           type: integer
 *         description: Filter by trimester
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: facilitatorId
 *         schema:
 *           type: string
 *         description: Filter by facilitator ID
 *       - in: query
 *         name: modeId
 *         schema:
 *           type: string
 *         description: Filter by mode ID
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *         description: Filter by module ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: cohortId
 *         schema:
 *           type: string
 *         description: Filter by cohort ID
 *     responses:
 *       200:
 *         description: Allocations retrieved successfully
 */
router.get('/', [
  query('trimester').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('facilitatorId').optional().isUUID(),
  query('modeId').optional().isUUID(),
  query('moduleId').optional().isUUID(),
  query('classId').optional().isUUID(),
  query('cohortId').optional().isUUID()
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

    const {
      trimester,
      year,
      facilitatorId,
      modeId,
      moduleId,
      classId,
      cohortId,
      page = 1,
      limit = 10
    } = req.query;

    // Build where clause
    const whereClause = { isActive: true };
    if (trimester) whereClause.trimester = trimester;
    if (year) whereClause.year = year;
    if (facilitatorId) whereClause.facilitatorId = facilitatorId;
    if (modeId) whereClause.modeId = modeId;
    if (moduleId) whereClause.moduleId = moduleId;
    if (classId) whereClause.classId = classId;
    if (cohortId) whereClause.cohortId = cohortId;

    // If facilitator, only show their allocations
    if (req.userRole === 'facilitator') {
      whereClause.facilitatorId = req.user.id;
    }

    const offset = (page - 1) * limit;

    const allocations = await CourseAllocation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'code', 'half']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'startDate', 'graduationDate']
        },
        {
          model: Facilitator,
          as: 'facilitator',
          attributes: ['id', 'name', 'email', 'qualification', 'location']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        allocations: allocations.rows,
        pagination: {
          total: allocations.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(allocations.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /allocations/{id}:
 *   get:
 *     summary: Get a specific course allocation
 *     tags: [Course Allocations]
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
 *         description: Allocation retrieved successfully
 *       404:
 *         description: Allocation not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await CourseAllocation.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'code', 'half', 'description']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'startDate', 'graduationDate']
        },
        {
          model: Facilitator,
          as: 'facilitator',
          attributes: ['id', 'name', 'email', 'qualification', 'location']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    // Check if facilitator can access this allocation
    if (req.userRole === 'facilitator' && allocation.facilitatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { allocation }
    });
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /allocations:
 *   post:
 *     summary: Create a new course allocation (Managers only)
 *     tags: [Course Allocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moduleId
 *               - classId
 *               - cohortId
 *               - facilitatorId
 *               - trimester
 *               - modeId
 *               - year
 *             properties:
 *               moduleId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               facilitatorId:
 *                 type: string
 *                 format: uuid
 *               trimester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               modeId:
 *                 type: string
 *                 format: uuid
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *     responses:
 *       201:
 *         description: Allocation created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeManager,
  body('moduleId').isUUID(),
  body('classId').isUUID(),
  body('cohortId').isUUID(),
  body('facilitatorId').isUUID(),
  body('trimester').isInt({ min: 1, max: 12 }),
  body('modeId').isUUID(),
  body('year').isInt({ min: 2020, max: 2030 })
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

    const { moduleId, classId, cohortId, facilitatorId, trimester, modeId, year } = req.body;

    // Check if allocation already exists
    const existingAllocation = await CourseAllocation.findOne({
      where: {
        moduleId,
        classId,
        cohortId,
        facilitatorId,
        trimester,
        year,
        isActive: true
      }
    });

    if (existingAllocation) {
      return res.status(409).json({
        success: false,
        message: 'Allocation already exists for this combination'
      });
    }

    const allocation = await CourseAllocation.create({
      moduleId,
      classId,
      cohortId,
      facilitatorId,
      trimester,
      modeId,
      year
    });

    // Fetch the created allocation with related data
    const createdAllocation = await CourseAllocation.findByPk(allocation.id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Facilitator,
          as: 'facilitator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Allocation created successfully',
      data: { allocation: createdAllocation }
    });
  } catch (error) {
    console.error('Create allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /allocations/{id}:
 *   put:
 *     summary: Update a course allocation (Managers only)
 *     tags: [Course Allocations]
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
 *               moduleId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               facilitatorId:
 *                 type: string
 *                 format: uuid
 *               trimester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               modeId:
 *                 type: string
 *                 format: uuid
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *     responses:
 *       200:
 *         description: Allocation updated successfully
 *       404:
 *         description: Allocation not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  authorizeManager,
  body('moduleId').optional().isUUID(),
  body('classId').optional().isUUID(),
  body('cohortId').optional().isUUID(),
  body('facilitatorId').optional().isUUID(),
  body('trimester').optional().isInt({ min: 1, max: 12 }),
  body('modeId').optional().isUUID(),
  body('year').optional().isInt({ min: 2020, max: 2030 })
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

    const allocation = await CourseAllocation.findOne({
      where: { id, isActive: true }
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    await allocation.update(updateData);

    // Fetch updated allocation with related data
    const updatedAllocation = await CourseAllocation.findByPk(id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Facilitator,
          as: 'facilitator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name']
        },
        {
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Allocation updated successfully',
      data: { allocation: updatedAllocation }
    });
  } catch (error) {
    console.error('Update allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /allocations/{id}:
 *   delete:
 *     summary: Delete a course allocation (Managers only)
 *     tags: [Course Allocations]
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
 *         description: Allocation deleted successfully
 *       404:
 *         description: Allocation not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await CourseAllocation.findOne({
      where: { id, isActive: true }
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    // Soft delete
    await allocation.update({ isActive: false });

    res.json({
      success: true,
      message: 'Allocation deleted successfully'
    });
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 