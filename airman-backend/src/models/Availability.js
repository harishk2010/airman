const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Availability = sequelize.define('Availability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  instructorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: true, // 0-6 for recurring
  },
}, {
  tableName: 'availabilities',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['instructor_id', 'start_time', 'end_time'] },
  ],
});

module.exports = Availability;
