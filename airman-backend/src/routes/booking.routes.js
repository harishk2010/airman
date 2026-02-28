const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, requireApproved } = require('../middlewares/rbac.middleware');
const { bookingLimiter } = require('../middlewares/rateLimit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createBookingSchema, updateBookingSchema, createAvailabilitySchema } = require('../validators/booking.schema');
const ctrl = require('../controllers/booking.controller');

router.use(authenticate);

// Availability
router.post('/availability', authorize('INSTRUCTOR'), validate(createAvailabilitySchema), ctrl.setAvailability);
router.get('/availability', ctrl.getAvailability);

// Bookings
router.post('/', authorize('STUDENT'), requireApproved, bookingLimiter, validate(createBookingSchema), ctrl.createBooking);
router.get('/', ctrl.getBookings);
router.get('/:id', ctrl.getBooking);
router.patch('/:id', authorize('ADMIN', 'INSTRUCTOR', 'STUDENT'), validate(updateBookingSchema), ctrl.updateBooking);

module.exports = router;
