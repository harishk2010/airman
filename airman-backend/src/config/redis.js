const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    // Use REDIS_URL directly if Railway provides it, otherwise use individual vars
    const config = process.env.REDIS_URL
      ? process.env.REDIS_URL
      : {
          host: env.REDIS.HOST || 'localhost',
          port: env.REDIS.PORT || 6379,
          password: env.REDIS.PASSWORD || undefined,
        };

    redisClient = new Redis(config, {
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, running without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      // Required for Railway Redis which uses TLS on rediss:// URLs
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.warn('Redis error:', err.message));
  }
  return redisClient;
};

module.exports = { getRedisClient };