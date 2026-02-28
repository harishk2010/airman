const { Op } = require('sequelize');
const { Booking, Availability, User } = require('../models');
const { getPagination, getPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('./audit.service');
const { scheduleEscalation } = require('./workflow.service');

const checkInstructorConflict = async (instructorId, startTime, endTime, excludeBookingId = null) => {
  const where = {
    instructorId,
    status: { [Op.in]: ['approved', 'assigned'] },
    [Op.or]: [
      { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
    ],
  };

  if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };

  const conflict = await Booking.findOne({ where });
  return !!conflict;
};

const createBooking = async ({ tenantId, studentId, data, correlationId }) => {
  const { startTime, endTime } = data;

  if (new Date(startTime) >= new Date(endTime)) {
    throw Object.assign(new Error('Start time must be before end time'), { statusCode: 400 });
  }

  if (new Date(startTime) <= new Date()) {
    throw Object.assign(new Error('Booking must be in the future'), { statusCode: 400 });
  }

  const booking = await Booking.create({
    tenantId,
    studentId,
    ...data,
    status: 'requested',
  });

  // Schedule escalation job
  await scheduleEscalation(booking.id, tenantId);

  await logAction({
    userId: studentId,
    tenantId,
    action: 'CREATE_BOOKING',
    resource: 'booking',
    resourceId: booking.id,
    after: data,
    correlationId,
  });

  return booking;
};

const getBookings = async ({ tenantId, userId, role, query }) => {
  const { page, limit, offset } = getPagination(query);
  const where = { tenantId };

  if (role === 'STUDENT') where.studentId = userId;
  if (role === 'INSTRUCTOR') where.instructorId = userId;
  if (query.status) where.status = query.status;
  if (query.from) where.startTime = { [Op.gte]: new Date(query.from) };
  if (query.to) where.endTime = { ...where.endTime, [Op.lte]: new Date(query.to) };

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'instructor', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit,
    offset,
    order: [['startTime', 'ASC']],
  });

  return getPaginatedResponse(rows, count, page, limit);
};

const getBookingById = async (id, tenantId) => {
  const booking = await Booking.findOne({
    where: { id, tenantId },
    include: [
      { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'instructor', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  return booking;
};

const updateBooking = async ({ id, tenantId, userId, role, data, correlationId }) => {
  const booking = await Booking.findOne({ where: { id, tenantId } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });

  const before = booking.toJSON();

  // RBAC-specific logic
  if (role === 'STUDENT' && data.status && data.status !== 'cancelled') {
    throw Object.assign(new Error('Students can only cancel bookings'), { statusCode: 403 });
  }

  if (data.instructorId) {
    // Verify instructor belongs to tenant
    const instructor = await User.findOne({
      where: { id: data.instructorId, tenantId, role: 'INSTRUCTOR', isActive: true },
    });
    if (!instructor) throw Object.assign(new Error('Instructor not found'), { statusCode: 404 });

    const hasConflict = await checkInstructorConflict(
      data.instructorId,
      booking.startTime,
      booking.endTime,
      id
    );
    if (hasConflict) throw Object.assign(new Error('Instructor has a conflicting booking'), { statusCode: 409 });

    data.status = 'assigned';
  }

  if (data.status === 'approved') data.approvedAt = new Date();
  if (data.status === 'completed') data.completedAt = new Date();

  await booking.update(data);

  await logAction({
    userId,
    tenantId,
    action: `UPDATE_BOOKING_STATUS_${data.status?.toUpperCase() || 'UPDATE'}`,
    resource: 'booking',
    resourceId: id,
    before,
    after: data,
    correlationId,
  });

  return booking;
};

const setAvailability = async ({ tenantId, instructorId, data }) => {
  const { startTime, endTime } = data;

  if (new Date(startTime) >= new Date(endTime)) {
    throw Object.assign(new Error('Start time must be before end time'), { statusCode: 400 });
  }

  return Availability.create({ tenantId, instructorId, ...data });
};

const getAvailability = async ({ tenantId, instructorId, query }) => {
  const { page, limit, offset } = getPagination(query);
  const where = { tenantId };
  if (instructorId) where.instructorId = instructorId;
  if (query.from) where.startTime = { [Op.gte]: new Date(query.from) };
  if (query.to) where.endTime = { ...where.endTime, [Op.lte]: new Date(query.to) };

  const { rows, count } = await Availability.findAndCountAll({
    where,
    include: [{ model: User, as: 'instructor', attributes: ['id', 'firstName', 'lastName'] }],
    limit,
    offset,
    order: [['startTime', 'ASC']],
  });

  return getPaginatedResponse(rows, count, page, limit);
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  setAvailability,
  getAvailability,
  checkInstructorConflict,
};
