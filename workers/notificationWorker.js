const { redisClient } = require('../config/redis');
const { Facilitator, Manager, ActivityTracker, CourseAllocation } = require('../models');
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailTemplates = {
  activityLogCreated: (facilitatorName, moduleName, weekNumber) => ({
    subject: 'New Activity Log Submitted',
    html: `
      <h2>New Activity Log Submitted</h2>
      <p><strong>Facilitator:</strong> ${facilitatorName}</p>
      <p><strong>Module:</strong> ${moduleName}</p>
      <p><strong>Week:</strong> ${weekNumber}</p>
      <p>Please review the activity log in the system.</p>
    `
  }),
  
  activityLogUpdated: (facilitatorName, moduleName, weekNumber) => ({
    subject: 'Activity Log Updated',
    html: `
      <h2>Activity Log Updated</h2>
      <p><strong>Facilitator:</strong> ${facilitatorName}</p>
      <p><strong>Module:</strong> ${moduleName}</p>
      <p><strong>Week:</strong> ${weekNumber}</p>
      <p>The activity log has been updated. Please review the changes.</p>
    `
  }),
  
  reminderFacilitator: (facilitatorName, moduleName, weekNumber) => ({
    subject: 'Activity Log Reminder',
    html: `
      <h2>Activity Log Reminder</h2>
      <p>Dear ${facilitatorName},</p>
      <p>This is a reminder to submit your activity log for:</p>
      <p><strong>Module:</strong> ${moduleName}</p>
      <p><strong>Week:</strong> ${weekNumber}</p>
      <p>Please submit your activity log as soon as possible.</p>
    `
  }),
  
  alertManager: (facilitatorName, moduleName, weekNumber) => ({
    subject: 'Activity Log Overdue Alert',
    html: `
      <h2>Activity Log Overdue Alert</h2>
      <p><strong>Facilitator:</strong> ${facilitatorName}</p>
      <p><strong>Module:</strong> ${moduleName}</p>
      <p><strong>Week:</strong> ${weekNumber}</p>
      <p>This activity log is overdue. Please follow up with the facilitator.</p>
    `
  })
};

const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](...data);
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

const processNotification = async (notification) => {
  try {
    const { type, facilitatorId, facilitatorName, allocationId, weekNumber, timestamp } = notification;
    
    switch (type) {
      case 'ACTIVITY_LOG_CREATED':
        await handleActivityLogCreated(notification);
        break;
        
      case 'ACTIVITY_LOG_UPDATED':
        await handleActivityLogUpdated(notification);
        break;
        
      case 'REMINDER_FACILITATOR':
        await handleReminderFacilitator(notification);
        break;
        
      case 'ALERT_MANAGER':
        await handleAlertManager(notification);
        break;
        
      default:
        console.warn(`⚠️ Unknown notification type: ${type}`);
    }
  } catch (error) {
    console.error('❌ Error processing notification:', error);
  }
};

const handleActivityLogCreated = async (notification) => {
  const { facilitatorId, facilitatorName, allocationId, weekNumber } = notification;
  
  try {
    const allocation = await CourseAllocation.findByPk(allocationId, {
      include: [
        { model: require('../models/Module'), as: 'module' },
        { model: require('../models/Manager'), as: 'manager' }
      ]
    });
    
    if (!allocation) {
      console.warn(`⚠️ Allocation not found: ${allocationId}`);
      return;
    }
    
    if (allocation.manager && allocation.manager.email) {
      await sendEmail(
        allocation.manager.email,
        'activityLogCreated',
        [facilitatorName, allocation.module.name, weekNumber]
      );
    }
    
    console.log(`✅ Activity log created notification processed for week ${weekNumber}`);
  } catch (error) {
    console.error('❌ Error handling activity log created:', error);
  }
};

const handleActivityLogUpdated = async (notification) => {
  const { facilitatorId, allocationId, weekNumber } = notification;
  
  try {
    const allocation = await CourseAllocation.findByPk(allocationId, {
      include: [
        { model: require('../models/Module'), as: 'module' },
        { model: require('../models/Manager'), as: 'manager' }
      ]
    });
    
    if (!allocation) {
      console.warn(`⚠️ Allocation not found: ${allocationId}`);
      return;
    }
    
    const facilitator = await Facilitator.findByPk(facilitatorId);
    
    if (allocation.manager && allocation.manager.email) {
      await sendEmail(
        allocation.manager.email,
        'activityLogUpdated',
        [facilitator.name, allocation.module.name, weekNumber]
      );
    }
    
    console.log(`✅ Activity log updated notification processed for week ${weekNumber}`);
  } catch (error) {
    console.error('❌ Error handling activity log updated:', error);
  }
};

const handleReminderFacilitator = async (notification) => {
  const { facilitatorId, allocationId, weekNumber } = notification;
  
  try {
    const facilitator = await Facilitator.findByPk(facilitatorId);
    if (!facilitator) {
      console.warn(`⚠️ Facilitator not found: ${facilitatorId}`);
      return;
    }
    
    const allocation = await CourseAllocation.findByPk(allocationId, {
      include: [{ model: require('../models/Module'), as: 'module' }]
    });
    
    if (!allocation) {
      console.warn(`⚠️ Allocation not found: ${allocationId}`);
      return;
    }
    
    await sendEmail(
      facilitator.email,
      'reminderFacilitator',
      [facilitator.name, allocation.module.name, weekNumber]
    );
    
    console.log(`✅ Reminder sent to facilitator ${facilitator.name} for week ${weekNumber}`);
  } catch (error) {
    console.error('❌ Error handling facilitator reminder:', error);
  }
};

const handleAlertManager = async (notification) => {
  const { facilitatorId, allocationId, weekNumber } = notification;
  
  try {
    const allocation = await CourseAllocation.findByPk(allocationId, {
      include: [
        { model: require('../models/Module'), as: 'module' },
        { model: require('../models/Manager'), as: 'manager' }
      ]
    });
    
    if (!allocation) {
      console.warn(`⚠️ Allocation not found: ${allocationId}`);
      return;
    }
    
    const facilitator = await Facilitator.findByPk(facilitatorId);
    
    if (allocation.manager && allocation.manager.email) {
      await sendEmail(
        allocation.manager.email,
        'alertManager',
        [facilitator.name, allocation.module.name, weekNumber]
      );
    }
    
    console.log(`✅ Alert sent to manager for overdue activity log week ${weekNumber}`);
  } catch (error) {
    console.error('❌ Error handling manager alert:', error);
  }
};

const checkOverdueLogs = async () => {
  try {
    const currentWeek = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    
    const allocations = await CourseAllocation.findAll({
      where: { isActive: true },
      include: [
        { model: require('../models/Module'), as: 'module' },
        { model: require('../models/Facilitator'), as: 'facilitator' }
      ]
    });
    
    for (const allocation of allocations) {
      const activityLog = await ActivityTracker.findOne({
        where: {
          allocationId: allocation.id,
          weekNumber: currentWeek,
          isActive: true
        }
      });
      
      if (!activityLog) {
        await redisClient.lpush('notifications', JSON.stringify({
          type: 'REMINDER_FACILITATOR',
          facilitatorId: allocation.facilitatorId,
          allocationId: allocation.id,
          weekNumber: currentWeek,
          timestamp: new Date().toISOString()
        }));
        
        if (currentWeek > 2) {
          await redisClient.lpush('notifications', JSON.stringify({
            type: 'ALERT_MANAGER',
            facilitatorId: allocation.facilitatorId,
            allocationId: allocation.id,
            weekNumber: currentWeek,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
    
    console.log(`✅ Overdue logs check completed for week ${currentWeek}`);
  } catch (error) {
    console.error('❌ Error checking overdue logs:', error);
  }
};

const startNotificationWorker = () => {
  console.log('🚀 Starting notification worker...');
  
  setInterval(async () => {
    try {
      const notification = await redisClient.rpop('notifications');
      if (notification) {
        const parsedNotification = JSON.parse(notification);
        await processNotification(parsedNotification);
      }
    } catch (error) {
      console.error('❌ Error in notification worker:', error);
    }
  }, 30000);
  
  setInterval(async () => {
    await checkOverdueLogs();
  }, 3600000);
  
  console.log('✅ Notification worker started successfully');
};

module.exports = {
  startNotificationWorker,
  processNotification,
  sendEmail
}; 