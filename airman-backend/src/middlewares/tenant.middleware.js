const enforceTenant = (req, res, next) => {
  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  
  if (tenantId && req.user && req.user.tenantId !== tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Cross-tenant access denied',
    });
  }
  next();
};

module.exports = { enforceTenant };
