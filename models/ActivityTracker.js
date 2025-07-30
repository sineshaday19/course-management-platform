const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityTracker = sequelize.define('ActivityTracker', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  allocationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'course_allocations',
      key: 'id'
    }
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 52
    }
  },
  attendance: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of attendance records for the week'
  },
  formativeOneGrading: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  formativeTwoGrading: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  summativeGrading: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  courseModeration: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  intranetSync: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  gradeBookStatus: {
    type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
    allowNull: false,
    defaultValue: 'Not Started',
    validate: {
      isIn: [['Done', 'Pending', 'Not Started']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'activity_trackers',
  indexes: [
    {
      unique: true,
      name: 'unique_activity_tracker',
      fields: ['allocation_id', 'week_number']
    }
  ],
  hooks: {
    beforeCreate: (activityTracker) => {
      if (activityTracker.submittedAt === null) {
        activityTracker.submittedAt = new Date();
      }
    },
    beforeUpdate: (activityTracker) => {
      if (activityTracker.changed() && !activityTracker.submittedAt) {
        activityTracker.submittedAt = new Date();
      }
    }
  }
});

module.exports = ActivityTracker; 