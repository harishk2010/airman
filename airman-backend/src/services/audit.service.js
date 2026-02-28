const { AuditLog } = require('../models');
const logger = require('../utils/logger');

const logAction = async ({
  userId = null,
  tenantId = null,
  action,
  resource,
  resourceId = null,
  before = null,
  after = null,
  correlationId = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      tenantId,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      before,
      after,
      correlationId,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
};

const auditMiddleware = (action, resource) => async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      logAction({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action,
        resource,
        resourceId: req.params?.id,
        correlationId: req.correlationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
  });
  next();
};

module.exports = { logAction, auditMiddleware };
