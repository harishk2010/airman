const { Worker } = require('bullmq');
const bullRedis = require('../config/bullRedis');
const { Booking, User } = require('../models');
const { logAction } = require('../services/audit.service');
const logger = require('../utils/logger');

const startEscalationWorker = () => {
  const worker = new Worker(
    'booking-escalation',
    async (job) => {
      const { bookingId, tenantId } = job.data;
      logger.info(`Processing escalation job for booking ${bookingId}`);

      const booking = await Booking.findOne({
        where: { id: bookingId, tenantId },
      });

      if (!booking || booking.status !== 'approved') return;

      const admins = await User.findAll({
        where: { tenantId, role: 'ADMIN', isActive: true },
      });

      for (const admin of admins) {
        logger.warn(
          `[EMAIL STUB] Escalation to ${admin.email}: Booking ${bookingId}`
        );
      }

      await booking.update({ escalatedAt: new Date() });

      await logAction({
        tenantId,
        action: 'BOOKING_ESCALATED',
        resource: 'booking',
        resourceId: bookingId,
      });
    },
    {
      connection: bullRedis,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  );

  worker.on('completed', (job) =>
    logger.info(`Escalation job ${job.id} completed`)
  );

  worker.on('failed', (job, err) =>
    logger.error(`Escalation job ${job.id} failed:`, err)
  );

  return worker;
};

module.exports = { startEscalationWorker };