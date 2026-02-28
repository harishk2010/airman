const { Queue } = require('bullmq');
const bullRedis = require('../config/bullRedis');
const logger = require('../utils/logger');

let escalationQueue = null;

const getEscalationQueue = () => {
  if (!escalationQueue) {
    escalationQueue = new Queue('booking-escalation', {
      connection: bullRedis,
    });
    logger.info('Escalation queue initialized');
  }
  return escalationQueue;
};

module.exports = { getEscalationQueue };