const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const isDev = env.NODE_ENV === 'development';

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: () => isDev,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT.AUTH_MAX,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: () => isDev,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { success: false, message: 'Too many booking requests' },
  skip: () => isDev,
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };
