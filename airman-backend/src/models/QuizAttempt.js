const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lessonId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'lessons', key: 'id' },
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  answers: {
    type: DataTypes.JSONB,
    allowNull: false,
    // { questionId: selectedOptionId }
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  correctCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  incorrectQuestions: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'quiz_attempts',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['student_id'] },
    { fields: ['lesson_id'] },
  ],
});

module.exports = QuizAttempt;
