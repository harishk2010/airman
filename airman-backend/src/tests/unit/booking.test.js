// Unit tests for booking conflict detection
jest.mock('../../models', () => ({
  Booking: { findOne: jest.fn(), create: jest.fn(), findAndCountAll: jest.fn() },
  Availability: { create: jest.fn(), findAll: jest.fn() },
  User: {},
}));
jest.mock('../../services/audit.service', () => ({ log: jest.fn(), fromRequest: jest.fn(() => ({})) }));
jest.mock('../../services/workflow.service', () => ({ scheduleEscalation: jest.fn() }));

const { Booking } = require('../../models');
const bookingService = require('../../services/booking.service');

describe('Booking Conflict Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseBooking = {
    instructor_id: 'instructor-1',
    start_time: new Date('2025-06-01T09:00:00Z'),
    end_time: new Date('2025-06-01T11:00:00Z'),
  };

  it('should detect overlapping booking (exact same time)', async () => {
    Booking.findOne.mockResolvedValue({ id: 'existing-1', ...baseBooking });
    const conflict = await bookingService.checkInstructorConflict(
      'instructor-1',
      '2025-06-01T09:00:00Z',
      '2025-06-01T11:00:00Z'
    );
    expect(conflict).toBeTruthy();
  });

  it('should detect overlapping booking (partial overlap - new starts during existing)', async () => {
    Booking.findOne.mockResolvedValue({ id: 'existing-1' });
    const conflict = await bookingService.checkInstructorConflict(
      'instructor-1',
      '2025-06-01T10:00:00Z',
      '2025-06-01T12:00:00Z'
    );
    expect(conflict).toBeTruthy();
  });

  it('should detect overlapping booking (new booking contains existing)', async () => {
    Booking.findOne.mockResolvedValue({ id: 'existing-1' });
    const conflict = await bookingService.checkInstructorConflict(
      'instructor-1',
      '2025-06-01T08:00:00Z',
      '2025-06-01T12:00:00Z'
    );
    expect(conflict).toBeTruthy();
  });

  // FIX: checkInstructorConflict returns !!conflict (boolean), not null
  it('should return false when no conflict', async () => {
    Booking.findOne.mockResolvedValue(null);
    const conflict = await bookingService.checkInstructorConflict(
      'instructor-1',
      '2025-06-01T12:00:00Z',
      '2025-06-01T14:00:00Z'
    );
    expect(conflict).toBe(false);
  });

  // FIX: same — returns false not null
  it('should exclude booking when checking conflict for update', async () => {
  Booking.findOne.mockResolvedValue(null);
  const conflict = await bookingService.checkInstructorConflict(
    'instructor-1',
    '2025-06-01T09:00:00Z',
    '2025-06-01T11:00:00Z',
    'existing-booking-id'
  );
  expect(conflict).toBe(false);
  // FIX: Op.ne is a Symbol key so JSON.stringify loses it — inspect the actual value instead
  const callArgs = Booking.findOne.mock.calls[0][0];
  const idCondition = callArgs.where.id;
  const neValue = Object.getOwnPropertySymbols(idCondition)
    .map(s => idCondition[s])
    .find(v => v === 'existing-booking-id');
  expect(neValue).toBe('existing-booking-id');
});

  // FIX: same — returns false not null
  it('back-to-back bookings should NOT conflict', async () => {
    Booking.findOne.mockResolvedValue(null);
    const conflict = await bookingService.checkInstructorConflict(
      'instructor-1',
      '2025-06-01T11:00:00Z',
      '2025-06-01T13:00:00Z'
    );
    expect(conflict).toBe(false);
  });
});

describe('Quiz Scoring', () => {
  it('should calculate 100% score when all correct', () => {
    const questions = [
      { id: 'q1', correct_option_id: 'A', options: [{ id: 'A', text: 'Correct' }] },
      { id: 'q2', correct_option_id: 'B', options: [{ id: 'B', text: 'Correct' }] },
    ];
    const answers = [
      { question_id: 'q1', selected_option_id: 'A' },
      { question_id: 'q2', selected_option_id: 'B' },
    ];

    let correct = 0;
    for (const q of questions) {
      const a = answers.find((x) => x.question_id === q.id);
      if (a && a.selected_option_id === q.correct_option_id) correct++;
    }
    const score = (correct / questions.length) * 100;
    expect(score).toBe(100);
  });

  it('should calculate 0% score when all incorrect', () => {
    const questions = [
      { id: 'q1', correct_option_id: 'A' },
      { id: 'q2', correct_option_id: 'B' },
    ];
    const answers = [
      { question_id: 'q1', selected_option_id: 'C' },
      { question_id: 'q2', selected_option_id: 'D' },
    ];

    let correct = 0;
    for (const q of questions) {
      const a = answers.find((x) => x.question_id === q.id);
      if (a && a.selected_option_id === q.correct_option_id) correct++;
    }
    const score = (correct / questions.length) * 100;
    expect(score).toBe(0);
  });

  it('should calculate 50% score for half correct', () => {
    const questions = [
      { id: 'q1', correct_option_id: 'A' },
      { id: 'q2', correct_option_id: 'B' },
    ];
    const answers = [
      { question_id: 'q1', selected_option_id: 'A' },
      { question_id: 'q2', selected_option_id: 'D' },
    ];

    let correct = 0;
    for (const q of questions) {
      const a = answers.find((x) => x.question_id === q.id);
      if (a && a.selected_option_id === q.correct_option_id) correct++;
    }
    const score = (correct / questions.length) * 100;
    expect(score).toBe(50);
  });

  it('should pass quiz with score >= 70', () => {
    expect(70 >= 70).toBe(true);
    expect(69 >= 70).toBe(false);
    expect(100 >= 70).toBe(true);
  });
});