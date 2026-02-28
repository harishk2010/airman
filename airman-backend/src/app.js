const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const correlationIdMiddleware = require('./utils/correlationId');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const env = require('./config/env');
const logger = require('./utils/logger');

const app = express();
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'airman-backend',
  });
});

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Correlation IDs
app.use(correlationIdMiddleware);

// Rate limiting
app.use(generalLimiter);

// Trust proxy (for correct IP behind load balancers)
app.set('trust proxy', 1);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/courses', require('./routes/course.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
