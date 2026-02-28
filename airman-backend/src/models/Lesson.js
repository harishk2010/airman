const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'modules', key: 'id' },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('TEXT', 'QUIZ'),
    allowNull: false,
    defaultValue: 'TEXT',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'lessons',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['module_id'] },
  ],
});

module.exports = Lesson;
