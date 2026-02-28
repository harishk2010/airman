const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS.HOST || 'localhost',
      port: env.REDIS.PORT || 6379,
      password: env.REDIS.PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, running without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.warn('Redis error:', err.message));
  }
  return redisClient;
};

module.exports = { getRedisClient };
