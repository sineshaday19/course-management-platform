const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  graduationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'classes',
  hooks: {
    beforeValidate: (classInstance) => {
      if (classInstance.startDate && classInstance.graduationDate) {
        if (new Date(classInstance.startDate) >= new Date(classInstance.graduationDate)) {
          throw new Error('Graduation date must be after start date');
        }
      }
    }
  }
});

module.exports = Class; 