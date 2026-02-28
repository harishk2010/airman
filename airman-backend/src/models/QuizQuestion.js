const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizQuestion = sequelize.define('QuizQuestion', {
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false,
    // [{ id: 'a', text: 'Option A' }, ...]
  },
  correctOptionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'quiz_questions',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['lesson_id'] },
  ],
});

module.exports = QuizQuestion;
