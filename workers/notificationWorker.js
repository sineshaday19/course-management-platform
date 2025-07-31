const { CourseAllocation, ActivityTracker } = require('../models');
const NotificationService = require('../services/notificationService');

class NotificationWorker {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Notification worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting notification worker...');

    await this.checkForNotifications();

    this.interval = setInterval(async () => {
      await this.checkForNotifications();
    }, this.checkInterval);
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Notification worker is not running');
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('🛑 Stopped notification worker');
  }

  async checkForNotifications() {
    try {
      console.log('🔍 Checking for notifications...');

      const allocations = await CourseAllocation.findAll({
        where: { isActive: true },
        include: [
          {
            model: require('../models').Module,
            as: 'module',
            attributes: ['id', 'name']
          },
          {
            model: require('../models').Facilitator,
            as: 'facilitator',
            attributes: ['id', 'name']
          }
        ]
      });

      const facilitatorsWithoutLogs = [];
      
      for (const allocation of allocations) {
        const activityLogs = await ActivityTracker.findAll({
          where: { 
            allocationId: allocation.id,
            isActive: true 
          }
        });

        if (activityLogs.length === 0) {
          facilitatorsWithoutLogs.push(allocation);
        }
      }

      if (facilitatorsWithoutLogs.length > 0) {
        console.log(`📧 Sending reminders to ${facilitatorsWithoutLogs.length} facilitators...`);
        await NotificationService.sendReminderToFacilitators(facilitatorsWithoutLogs);
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const overdueAllocations = allocations.filter(allocation => {
        return allocation.createdAt < oneWeekAgo;
      });

      if (overdueAllocations.length > 0) {
        console.log(`⚠️ Sending deadline alerts for ${overdueAllocations.length} allocations...`);
        await NotificationService.sendDeadlineAlertToManagers(overdueAllocations);
      }

      console.log('✅ Notification check completed');
    } catch (error) {
      console.error('❌ Error in notification worker:', error);
    }
  }

  async triggerNotificationCheck() {
    console.log('🔔 Manual notification check triggered');
    await this.checkForNotifications();
  }
}

const notificationWorker = new NotificationWorker();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down notification worker...');
  await notificationWorker.stop();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down notification worker...');
  await notificationWorker.stop();
});

module.exports = {
  notificationWorker,
  startNotificationWorker: () => notificationWorker.start(),
  stopNotificationWorker: () => notificationWorker.stop(),
  triggerNotificationCheck: () => notificationWorker.triggerNotificationCheck()
}; 