const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { ActivityTracker, CourseAllocation, Module, Class, Facilitator } = require('../models');
const { authorizeManager, authorizeFacilitator } = require('../middleware/auth');
const { redisClient } = require('../config/redis');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const NotificationService = require('../services/notificationService');

const router = express.Router();

/**
 * @swagger
 * /activity-tracker:
 *   get:
 *     summary: Get activity tracker logs with filtering
 *     tags: [Activity Tracker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: allocationId
 *         schema:
 *           type: string
 *         description: Filter by allocation ID
 *       - in: query
 *         name: weekNumber
 *         schema:
 *           type: integer
 *         description: Filter by week number
 *       - in: query
 *         name: facilitatorId
 *         schema:
 *           type: string
 *         description: Filter by facilitator ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 */
router.get('/', [
  query('allocationId').optional().isUUID(),
  query('weekNumber').optional().isInt({ min: 1, max: 52 }),
  query('facilitatorId').optional().isUUID(),
  query('status').optional().isIn(['Done', 'Pending', 'Not Started'])
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
      allocationId,
      weekNumber,
      facilitatorId,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build where clause
    const whereClause = { isActive: true };
    if (allocationId) whereClause.allocationId = allocationId;
    if (weekNumber) whereClause.weekNumber = weekNumber;
    if (status) {
      // Filter by any status field that matches
      whereClause[`$or`] = [
        { formativeOneGrading: status },
        { formativeTwoGrading: status },
        { summativeGrading: status },
        { courseModeration: status },
        { intranetSync: status },
        { gradeBookStatus: status }
      ];
    }

    const includeClause = [
      {
        model: CourseAllocation,
        as: 'allocation',
        where: facilitatorId ? { facilitatorId } : undefined,
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
          }
        ]
      }
    ];

    // If facilitator, only show their logs
    if (req.userRole === 'facilitator') {
      includeClause[0].where = { facilitatorId: req.user.id };
    }

    const offset = (page - 1) * limit;

    const activityLogs = await ActivityTracker.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['weekNumber', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        activityLogs: activityLogs.rows,
        pagination: {
          total: activityLogs.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(activityLogs.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /activity-tracker/{id}:
 *   get:
 *     summary: Get a specific activity log
 *     tags: [Activity Tracker]
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
 *         description: Activity log retrieved successfully
 *       404:
 *         description: Activity log not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const activityLog = await ActivityTracker.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: CourseAllocation,
          as: 'allocation',
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
            }
          ]
        }
      ]
    });

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    // Check if facilitator can access this log
    if (req.userRole === 'facilitator' && 
        activityLog.allocation.facilitatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { activityLog }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /activity-tracker:
 *   post:
 *     summary: Create a new activity log (Facilitators only)
 *     tags: [Activity Tracker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allocationId
 *               - weekNumber
 *             properties:
 *               allocationId:
 *                 type: string
 *                 format: uuid
 *               weekNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 52
 *               attendance:
 *                 type: array
 *                 items:
 *                   type: object
 *               formativeOneGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               formativeTwoGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               summativeGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               courseModeration:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               intranetSync:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               gradeBookStatus:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', [
  authorizeFacilitator,
  body('allocationId').isUUID(),
  body('weekNumber').isInt({ min: 1, max: 52 }),
  body('attendance').optional().isArray(),
  body('formativeOneGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('formativeTwoGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('summativeGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('courseModeration').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('intranetSync').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('gradeBookStatus').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('notes').optional().isString()
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
      allocationId,
      weekNumber,
      attendance = [],
      formativeOneGrading = 'Not Started',
      formativeTwoGrading = 'Not Started',
      summativeGrading = 'Not Started',
      courseModeration = 'Not Started',
      intranetSync = 'Not Started',
      gradeBookStatus = 'Not Started',
      notes
    } = req.body;

    // Verify the allocation belongs to the facilitator
    const allocation = await CourseAllocation.findOne({
      where: { id: allocationId, isActive: true }
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }

    if (allocation.facilitatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create logs for your own allocations.'
      });
    }

    // Check if log already exists for this allocation and week
    const existingLog = await ActivityTracker.findOne({
      where: { allocationId, weekNumber, isActive: true }
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: 'Activity log already exists for this allocation and week'
      });
    }

    const activityLog = await ActivityTracker.create({
      allocationId,
      weekNumber,
      attendance,
      formativeOneGrading,
      formativeTwoGrading,
      summativeGrading,
      courseModeration,
      intranetSync,
      gradeBookStatus,
      notes
    });

    // Send notification to manager about new activity log
    try {
      await NotificationService.sendSubmissionAlertToManager(activityLog);
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Fetch the created log with related data
    const createdLog = await ActivityTracker.findByPk(activityLog.id, {
      include: [
        {
          model: CourseAllocation,
          as: 'allocation',
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
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: { activityLog: createdLog }
    });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /activity-tracker/{id}:
 *   put:
 *     summary: Update an activity log (Facilitators can update their own, Managers can update any)
 *     tags: [Activity Tracker]
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
 *               attendance:
 *                 type: array
 *               formativeOneGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               formativeTwoGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               summativeGrading:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               courseModeration:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               intranetSync:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               gradeBookStatus:
 *                 type: string
 *                 enum: [Done, Pending, Not Started]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Activity log updated successfully
 *       404:
 *         description: Activity log not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', [
  body('attendance').optional().isArray(),
  body('formativeOneGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('formativeTwoGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('summativeGrading').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('courseModeration').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('intranetSync').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('gradeBookStatus').optional().isIn(['Done', 'Pending', 'Not Started']),
  body('notes').optional().isString()
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

    const activityLog = await ActivityTracker.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: CourseAllocation,
          as: 'allocation'
        }
      ]
    });

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    // Check access permissions
    if (req.userRole === 'facilitator' && 
        activityLog.allocation.facilitatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own activity logs.'
      });
    }

    await activityLog.update(updateData);

    // Send notification about log update
    try {
      await NotificationService.sendSubmissionAlertToManager(activityLog);
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Fetch updated log with related data
    const updatedLog = await ActivityTracker.findByPk(id, {
      include: [
        {
          model: CourseAllocation,
          as: 'allocation',
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
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Activity log updated successfully',
      data: { activityLog: updatedLog }
    });
  } catch (error) {
    console.error('Update activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /activity-tracker/{id}:
 *   delete:
 *     summary: Delete an activity log (Managers only)
 *     tags: [Activity Tracker]
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
 *         description: Activity log deleted successfully
 *       404:
 *         description: Activity log not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', [authorizeManager], async (req, res) => {
  try {
    const { id } = req.params;

    const activityLog = await ActivityTracker.findOne({
      where: { id, isActive: true }
    });

    if (!activityLog) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    // Soft delete
    await activityLog.update({ isActive: false });

    res.json({
      success: true,
      message: 'Activity log deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 