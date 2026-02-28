const { z } = require('zod');

const createBookingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    instructorId: z.string().uuid().optional(),
    status: z.enum(['approved', 'assigned', 'completed', 'cancelled']).optional(),
    cancelReason: z.string().optional(),
  }),
});

const createAvailabilitySchema = z.object({
  body: z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isRecurring: z.boolean().optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
  }),
});

module.exports = { createBookingSchema, updateBookingSchema, createAvailabilitySchema };
