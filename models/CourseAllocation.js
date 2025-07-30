const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseAllocation = sequelize.define('CourseAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id'
    }
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    }
  },
  cohortId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cohorts',
      key: 'id'
    }
  },
  facilitatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'facilitators',
      key: 'id'
    }
  },
  trimester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  modeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modes',
      key: 'id'
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2020,
      max: 2030
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'course_allocations',
  indexes: [
    {
      unique: true,
      name: 'unique_allocation',
      fields: ['module_id', 'class_id', 'cohort_id', 'facilitator_id', 'trimester', 'year']
    }
  ]
});

module.exports = CourseAllocation; 