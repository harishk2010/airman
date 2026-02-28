const { getRedisClient } = require('../config/redis');
const logger = require('./logger');

const DEFAULT_TTL = 300; // 5 minutes

const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.warn('Cache get error:', err.message);
    return null;
  }
};

const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn('Cache set error:', err.message);
  }
};

const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    logger.warn('Cache del error:', err.message);
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch (err) {
    logger.warn('Cache del pattern error:', err.message);
  }
};

module.exports = { cacheGet, cacheSet, cacheDel, cacheDelPattern };
