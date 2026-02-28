const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'Registration successful. Await admin approval.', data: result });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, {
      correlationId: req.correlationId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, refreshToken, logout, me };
