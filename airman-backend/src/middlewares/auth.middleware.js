const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT.SECRET);

    const user = await User.findOne({
      where: { id: decoded.userId, tenantId: decoded.tenantId, isActive: true },
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      isApproved: user.isApproved,
      email: user.email,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
