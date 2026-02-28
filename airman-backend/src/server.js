require('./models'); // Initialize associations
const app = require('./app');
const { connectDB } = require('./config/db');
const { getRedisClient } = require('./config/redis');
const { startEscalationWorker } = require('./jobs/escalation.worker');
const env = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
  // Connect DB
  await connectDB();

  // Connect Redis (non-blocking)
  try {
    
    const redis = getRedisClient();
    await redis.connect();
  } catch (err) {
    logger.warn('Redis unavailable, continuing without cache/jobs');
  }

  // Start background workers
  startEscalationWorker();

  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(`AIRMAN API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
    process.exit(1);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
