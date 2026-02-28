const { sequelize } = require('../config/db');
const Tenant = require('./Tenant');
const User = require('./User');
const Course = require('./Course');
const Module = require('./Module');
const Lesson = require('./Lesson');
const QuizQuestion = require('./QuizQuestion');
const QuizAttempt = require('./QuizAttempt');
const Availability = require('./Availability');
const Booking = require('./Booking');
const AuditLog = require('./AuditLog');

// Tenant → Users
Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Tenant → Courses
Tenant.hasMany(Course, { foreignKey: 'tenantId', as: 'courses' });
Course.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Instructor → Courses
User.hasMany(Course, { foreignKey: 'instructorId', as: 'taughtCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// Course → Modules
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules', onDelete: 'CASCADE' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Module → Lessons
Module.hasMany(Lesson, { foreignKey: 'moduleId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// Lesson → QuizQuestions
Lesson.hasMany(QuizQuestion, { foreignKey: 'lessonId', as: 'questions', onDelete: 'CASCADE' });
QuizQuestion.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// Lesson → QuizAttempts
Lesson.hasMany(QuizAttempt, { foreignKey: 'lessonId', as: 'attempts' });
QuizAttempt.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// Student → QuizAttempts
User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Instructor → Availabilities
User.hasMany(Availability, { foreignKey: 'instructorId', as: 'availabilities' });
Availability.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// Bookings
User.hasMany(Booking, { foreignKey: 'studentId', as: 'bookingsAsStudent' });
User.hasMany(Booking, { foreignKey: 'instructorId', as: 'bookingsAsInstructor' });
Booking.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Booking.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Course,
  Module,
  Lesson,
  QuizQuestion,
  QuizAttempt,
  Availability,
  Booking,
  AuditLog,
};
