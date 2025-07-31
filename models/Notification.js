const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  recipientType: {
    type: DataTypes.ENUM('manager', 'facilitator'),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('reminder', 'alert', 'submission', 'deadline'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  relatedEntityType: {
    type: DataTypes.ENUM('allocation', 'activity_tracker'),
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['recipientId', 'recipientType']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['scheduledFor']
    }
  ]
});

module.exports = Notification; 