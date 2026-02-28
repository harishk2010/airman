/**
 * Check if a new time slot conflicts with any existing bookings.
 * Conflict condition: start < existingEnd AND end > existingStart
 */
const detectConflict = (existingBookings, newStart, newEnd) => {
  return existingBookings.some(
    (b) => newStart < b.endTime && newEnd > b.startTime
  );
};

module.exports = { detectConflict };
