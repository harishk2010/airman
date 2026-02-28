const { getEscalationQueue } = require('../jobs/queues');
const env = require('../config/env');
const logger = require('../utils/logger');

const scheduleEscalation = async (bookingId, tenantId) => {
  try {
    const queue = getEscalationQueue();
    if (!queue) return;

    const delayMs = env.ESCALATION_DELAY_HOURS * 60 * 60 * 1000;
    await queue.add(
      'check-assignment',
      { bookingId, tenantId },
      {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        jobId: `escalation:${bookingId}`,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );
    logger.info(`Escalation scheduled for booking ${bookingId}`);
  } catch (err) {
    logger.warn('Failed to schedule escalation:', err.message);
  }
};

module.exports = { scheduleEscalation };
