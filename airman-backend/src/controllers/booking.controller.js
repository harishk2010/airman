const bookingService = require('../services/booking.service');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({
      tenantId: req.user.tenantId,
      studentId: req.user.id,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getBookings({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      role: req.user.role,
      query: req.query,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.tenantId);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

const updateBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBooking({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      role: req.user.role,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

const setAvailability = async (req, res, next) => {
  try {
    const availability = await bookingService.setAvailability({
      tenantId: req.user.tenantId,
      instructorId: req.user.id,
      data: req.body,
    });
    res.status(201).json({ success: true, data: availability });
  } catch (err) { next(err); }
};

const getAvailability = async (req, res, next) => {
  try {
    const result = await bookingService.getAvailability({
      tenantId: req.user.tenantId,
      instructorId: req.query.instructorId,
      query: req.query,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

module.exports = { createBooking, getBookings, getBooking, updateBooking, setAvailability, getAvailability };
