// Unit test: Booking conflict detection logic
const { detectConflict } = require('../../utils/conflictDetector');

describe('Booking Conflict Detection', () => {
  const existingBookings = [
    { startTime: new Date('2024-06-01T09:00:00Z'), endTime: new Date('2024-06-01T10:00:00Z') },
    { startTime: new Date('2024-06-01T14:00:00Z'), endTime: new Date('2024-06-01T15:00:00Z') },
  ];

  test('should detect conflict when new booking overlaps start', () => {
    const newStart = new Date('2024-06-01T08:30:00Z');
    const newEnd = new Date('2024-06-01T09:30:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(true);
  });

  test('should detect conflict when new booking overlaps end', () => {
    const newStart = new Date('2024-06-01T09:30:00Z');
    const newEnd = new Date('2024-06-01T10:30:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(true);
  });

  test('should detect conflict when new booking is contained within existing', () => {
    const newStart = new Date('2024-06-01T09:15:00Z');
    const newEnd = new Date('2024-06-01T09:45:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(true);
  });

  test('should detect conflict when existing booking is contained within new', () => {
    const newStart = new Date('2024-06-01T08:00:00Z');
    const newEnd = new Date('2024-06-01T11:00:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(true);
  });

  test('should not detect conflict for adjacent booking (back-to-back)', () => {
    const newStart = new Date('2024-06-01T10:00:00Z');
    const newEnd = new Date('2024-06-01T11:00:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(false);
  });

  test('should not detect conflict for completely separate time slot', () => {
    const newStart = new Date('2024-06-01T11:00:00Z');
    const newEnd = new Date('2024-06-01T13:00:00Z');
    expect(detectConflict(existingBookings, newStart, newEnd)).toBe(false);
  });

  test('should handle empty bookings list', () => {
    expect(detectConflict([], new Date(), new Date())).toBe(false);
  });
});
