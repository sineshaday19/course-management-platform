const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cohort = sequelize.define('Cohort', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  intakePeriod: {
    type: DataTypes.ENUM('HT1', 'HT2', 'FT'),
    allowNull: false,
    validate: {
      isIn: [['HT1', 'HT2', 'FT']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'cohorts'
});

module.exports = Cohort; 