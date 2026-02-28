require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    NAME: process.env.DB_NAME || 'airman_db',
    USER: process.env.DB_USER || 'airman_user',
    PASSWORD: process.env.DB_PASSWORD || 'airman_password',
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    AUTH_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },

  ESCALATION_DELAY_HOURS: parseInt(process.env.ESCALATION_DELAY_HOURS, 10) || 2,
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = env;
