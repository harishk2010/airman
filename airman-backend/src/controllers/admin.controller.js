const { User, Tenant, AuditLog } = require('../models');
const { getPagination, getPaginatedResponse } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');
const bcrypt = require('bcryptjs');

// ─── PUBLIC: List tenants for login/register dropdown ──────────────────────
const getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: tenants });
  } catch (err) { next(err); }
};

// ─── ADMIN: Get users with filters/pagination ──────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = { tenantId: req.user.tenantId };
    if (req.query.role) where.role = req.query.role;
    if (req.query.approved !== undefined) where.isApproved = req.query.approved === 'true';

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...getPaginatedResponse(rows, count, page, limit) });
  } catch (err) { next(err); }
};

// ─── ADMIN: Approve student account ───────────────────────────────────────
const approveUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const before = { isApproved: user.isApproved };
    await user.update({ isApproved: true });

    await logAction({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      action: 'APPROVE_USER',
      resource: 'user',
      resourceId: user.id,
      before,
      after: { isApproved: true },
      correlationId: req.correlationId,
    });

    res.json({ success: true, message: 'User approved', data: { id: user.id, isApproved: true } });
  } catch (err) { next(err); }
};

// ─── ADMIN: Create instructor (admin-only, pre-approved) ──────────────────
const createInstructor = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await User.findOne({ where: { email, tenantId: req.user.tenantId } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const instructor = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      tenantId: req.user.tenantId,
      role: 'INSTRUCTOR',
      isApproved: true,
    });

    await logAction({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      action: 'CREATE_INSTRUCTOR',
      resource: 'user',
      resourceId: instructor.id,
      after: { email, role: 'INSTRUCTOR' },
      correlationId: req.correlationId,
    });

    res.status(201).json({
      success: true,
      data: {
        id: instructor.id,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        role: instructor.role,
      },
    });
  } catch (err) { next(err); }
};

// ─── ADMIN: Change user role ───────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findOne({ where: { id: req.params.id, tenantId: req.user.tenantId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const before = { role: user.role };
    await user.update({ role });

    await logAction({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      action: 'CHANGE_USER_ROLE',
      resource: 'user',
      resourceId: user.id,
      before,
      after: { role },
      correlationId: req.correlationId,
    });

    res.json({ success: true, message: 'Role updated', data: { id: user.id, role } });
  } catch (err) { next(err); }
};

// ─── ADMIN: Audit logs ─────────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = { tenantId: req.user.tenantId };
    if (req.query.action) where.action = req.query.action;
    if (req.query.userId) where.userId = req.query.userId;

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...getPaginatedResponse(rows, count, page, limit) });
  } catch (err) { next(err); }
};

module.exports = { getTenants, getUsers, approveUser, createInstructor, updateUserRole, getAuditLogs };
