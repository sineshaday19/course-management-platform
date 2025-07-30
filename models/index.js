const Manager = require('./Manager');
const Module = require('./Module');
const Cohort = require('./Cohort');
const Class = require('./Class');
const Student = require('./Student');
const Facilitator = require('./Facilitator');
const Mode = require('./Mode');
const CourseAllocation = require('./CourseAllocation');
const ActivityTracker = require('./ActivityTracker');

// Manager - Facilitator relationship (One-to-Many)
Manager.hasMany(Facilitator, {
  foreignKey: 'managerId',
  as: 'facilitators'
});
Facilitator.belongsTo(Manager, {
  foreignKey: 'managerId',
  as: 'manager'
});

// Class - Student relationship (One-to-Many)
Class.hasMany(Student, {
  foreignKey: 'classId',
  as: 'students'
});
Student.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class'
});

// Cohort - Student relationship (One-to-Many)
Cohort.hasMany(Student, {
  foreignKey: 'cohortId',
  as: 'students'
});
Student.belongsTo(Cohort, {
  foreignKey: 'cohortId',
  as: 'cohort'
});

// CourseAllocation relationships
CourseAllocation.belongsTo(Module, {
  foreignKey: 'moduleId',
  as: 'module'
});
Module.hasMany(CourseAllocation, {
  foreignKey: 'moduleId',
  as: 'allocations'
});

CourseAllocation.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class'
});
Class.hasMany(CourseAllocation, {
  foreignKey: 'classId',
  as: 'allocations'
});

CourseAllocation.belongsTo(Cohort, {
  foreignKey: 'cohortId',
  as: 'cohort'
});
Cohort.hasMany(CourseAllocation, {
  foreignKey: 'cohortId',
  as: 'allocations'
});

CourseAllocation.belongsTo(Facilitator, {
  foreignKey: 'facilitatorId',
  as: 'facilitator'
});
Facilitator.hasMany(CourseAllocation, {
  foreignKey: 'facilitatorId',
  as: 'allocations'
});

CourseAllocation.belongsTo(Mode, {
  foreignKey: 'modeId',
  as: 'mode'
});
Mode.hasMany(CourseAllocation, {
  foreignKey: 'modeId',
  as: 'allocations'
});

// ActivityTracker - CourseAllocation relationship
ActivityTracker.belongsTo(CourseAllocation, {
  foreignKey: 'allocationId',
  as: 'allocation'
});
CourseAllocation.hasMany(ActivityTracker, {
  foreignKey: 'allocationId',
  as: 'activityLogs'
});

module.exports = {
  Manager,
  Module,
  Cohort,
  Class,
  Student,
  Facilitator,
  Mode,
  CourseAllocation,
  ActivityTracker
}; 