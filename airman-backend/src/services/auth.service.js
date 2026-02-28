const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant } = require('../models');
const env = require('../config/env');
const { logAction } = require('./audit.service');

const generateTokens = (user) => {
  const payload = { userId: user.id, tenantId: user.tenantId, role: user.role };

  const accessToken = jwt.sign(payload, env.JWT.SECRET, {
    expiresIn: env.JWT.EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT.REFRESH_SECRET, {
    expiresIn: env.JWT.REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Register: students self-register with tenantSlug, isApproved = false (pending admin approval)
const register = async ({ firstName, lastName, email, password, tenantSlug }) => {
  const tenant = await Tenant.findOne({ where: { slug: tenantSlug, isActive: true } });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });

  const existing = await User.findOne({ where: { email, tenantId: tenant.id } });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    tenantId: tenant.id,
    role: 'STUDENT',
    isApproved: false,  // must be approved by admin before login
  });

  await logAction({
    userId: user.id,
    tenantId: tenant.id,
    action: 'REGISTER',
    resource: 'user',
    resourceId: user.id,
    after: { email, role: 'STUDENT' },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isApproved: user.isApproved,
    },
  };
};

// Login: all roles use tenantSlug; students must be approved first
const login = async ({ email, password, tenantSlug }, { correlationId, ipAddress, userAgent }) => {
  const tenant = await Tenant.findOne({ where: { slug: tenantSlug, isActive: true } });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });

  const user = await User.findOne({
    where: { email, tenantId: tenant.id, isActive: true },
  });

  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  // Students must be approved by admin before they can log in
  if (user.role === 'STUDENT' && !user.isApproved) {
    throw Object.assign(
      new Error('Your account is pending admin approval. Please wait for clearance.'),
      { statusCode: 403 }
    );
  }

  const { accessToken, refreshToken } = generateTokens(user);

  await user.update({ refreshToken, lastLoginAt: new Date() });

  await logAction({
    userId: user.id,
    tenantId: tenant.id,
    action: 'LOGIN',
    resource: 'user',
    resourceId: user.id,
    correlationId,
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isApproved: user.isApproved,
      tenantId: user.tenantId,
    },
  };
};

const refreshTokens = async (token) => {
  const decoded = jwt.verify(token, env.JWT.REFRESH_SECRET);

  const user = await User.findOne({
    where: { id: decoded.userId, refreshToken: token, isActive: true },
  });

  if (!user) throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });

  const tokens = generateTokens(user);
  await user.update({ refreshToken: tokens.refreshToken });

  return tokens;
};

const logout = async (userId) => {
  await User.update({ refreshToken: null }, { where: { id: userId } });
};

module.exports = { register, login, refreshTokens, logout };
