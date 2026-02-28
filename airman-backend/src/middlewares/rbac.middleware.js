const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required roles: ${roles.join(', ')}`,
    });
  }
  next();
};

const requireApproved = (req, res, next) => {
  if (!req.user.isApproved && req.user.role === 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Account pending approval by admin',
    });
  }
  next();
};

module.exports = { authorize, requireApproved };
