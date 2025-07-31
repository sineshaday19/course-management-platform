const { Notification, Manager, Facilitator } = require('../models');

class NotificationService {
  static async createNotification({
    recipientId,
    recipientType,
    type,
    title,
    message,
    relatedEntityId = null,
    relatedEntityType = null,
    scheduledFor = null,
    metadata = {}
  }) {
    try {
      const notification = await Notification.create({
        recipientId,
        recipientType,
        type,
        title,
        message,
        relatedEntityId,
        relatedEntityType,
        scheduledFor,
        metadata
      });

      console.log(`📧 Notification created: ${type} - ${title} for ${recipientType} ${recipientId}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      throw error;
    }
  }

  static async sendReminderToFacilitators(allocations) {
    const reminders = [];
    
    for (const allocation of allocations) {
      const hasActivityLog = await allocation.getActivityLogs();
      
      if (!hasActivityLog || hasActivityLog.length === 0) {
        const reminder = await this.createNotification({
          recipientId: allocation.facilitatorId,
          recipientType: 'facilitator',
          type: 'reminder',
          title: 'Activity Log Reminder',
          message: `Please submit your activity log for allocation ${allocation.id}. Deadline is approaching.`,
          relatedEntityId: allocation.id,
          relatedEntityType: 'allocation',
          metadata: {
            allocationId: allocation.id,
            moduleName: allocation.module?.name,
            facilitatorName: allocation.facilitator?.name
          }
        });
        reminders.push(reminder);
      }
    }

    return reminders;
  }

  static async sendSubmissionAlertToManager(activityLog) {
    const allocation = await activityLog.getAllocation({
      include: [
        { model: require('../models').Module, as: 'module' },
        { model: require('../models').Facilitator, as: 'facilitator' }
      ]
    });

    const manager = await allocation.getFacilitator().then(f => f.getManager());

    return await this.createNotification({
      recipientId: manager.id,
      recipientType: 'manager',
      type: 'submission',
      title: 'Activity Log Submitted',
      message: `${allocation.facilitator.name} has submitted activity log for ${allocation.module.name}`,
      relatedEntityId: activityLog.id,
      relatedEntityType: 'activity_tracker',
      metadata: {
        facilitatorName: allocation.facilitator.name,
        moduleName: allocation.module.name,
        allocationId: allocation.id
      }
    });
  }

  /**
   * Send deadline alert to managers
   */
  static async sendDeadlineAlertToManagers(allocations) {
    const alerts = [];
    
    for (const allocation of allocations) {
      const manager = await allocation.getFacilitator().then(f => f.getManager());
      
      const alert = await this.createNotification({
        recipientId: manager.id,
        recipientType: 'manager',
        type: 'deadline',
        title: 'Deadline Alert',
        message: `Facilitator ${allocation.facilitator.name} has not submitted activity log for ${allocation.module.name}. Deadline passed.`,
        relatedEntityId: allocation.id,
        relatedEntityType: 'allocation',
        metadata: {
          facilitatorName: allocation.facilitator.name,
          moduleName: allocation.module.name,
          allocationId: allocation.id
        }
      });
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId, userType, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    
    const whereClause = {
      recipientId: userId,
      recipientType: userType
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    return await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    return await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          id: notificationId,
          recipientId: userId
        }
      }
    );
  }

  /**
   * Mark notification as delivered
   */
  static async markAsDelivered(notificationId) {
    return await Notification.update(
      {
        isDelivered: true,
        deliveredAt: new Date()
      },
      {
        where: { id: notificationId }
      }
    );
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId, userType) {
    return await Notification.count({
      where: {
        recipientId: userId,
        recipientType: userType,
        isRead: false
      }
    });
  }
}

module.exports = NotificationService; 