const express = require('express');
const { body, query, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const NotificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean'),
  validateRequest
], async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;
    const userType = req.user.role;

    const notifications = await NotificationService.getUserNotifications(
      userId, 
      userType, 
      { limit: parseInt(limit), offset: parseInt(offset), unreadOnly }
    );

    const unreadCount = await NotificationService.getUnreadCount(userId, userType);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: notifications.length,
          unreadCount
        }
      }
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/:id/read', [
  param('id').isUUID().withMessage('Invalid notification ID'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await NotificationService.markAsRead(id, userId);

    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already read'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    const { Notification } = require('../models');
    
    const result = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          recipientId: userId,
          recipientType: userType,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: `${result[0]} notifications marked as read`
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
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
 *                     unreadCount:
 *                       type: integer
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    const unreadCount = await NotificationService.getUnreadCount(userId, userType);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

module.exports = router; 