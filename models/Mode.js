const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mode = sequelize.define('Mode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.ENUM('online', 'in-person', 'hybrid'),
    allowNull: false,
    unique: true,
    validate: {
      isIn: [['online', 'in-person', 'hybrid']]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'modes'
});

module.exports = Mode; 