const Redis = require('ioredis');
const env = require('./env');

const bullRedis = new Redis({
  host: env.REDIS.HOST || 'localhost',
  port: env.REDIS.PORT || 6379,
  password: env.REDIS.PASSWORD || undefined,

  // 🔥 REQUIRED BY BULLMQ
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

module.exports = bullRedis;