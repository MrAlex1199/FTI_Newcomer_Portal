import crypto from 'crypto';
import { User, AuditLog, USER_ROLES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { paginatedResponse, parsePagination } from '../utils/pagination.js';
import { ROLES } from '../config/permissions.js';
import { safeUserSnapshot, serializeUser } from '../services/auditService.js';

const USER_SORT_FIELDS = ['createdAt', 'username', 'email', 'role', 'lastLoginAt', 'isActive'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const generateTemporaryPassword = () => `FTI-${crypto.randomBytes(9).toString('base64url')}-9a`;
const isSuperAdmin = (req) => req.user.role === ROLES.SUPER_ADMIN;

const assertAssignableRole = (req, role) => {
  if (role === ROLES.SUPER_ADMIN && !isSuperAdmin(req)) {
    throw ApiError.forbidden('Only a super admin may assign the super_admin role');
  }
};

const assertNotLastActiveSuperAdmin = async (user) => {
  if (user.role !== ROLES.SUPER_ADMIN || !user.isActive) return;
  const activeCount = await User.countDocuments({ role: ROLES.SUPER_ADMIN, isActive: true });
  if (activeCount <= 1) throw ApiError.conflict('The last active super admin cannot be deactivated or demoted');
};

const findUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const listAdminUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: USER_SORT_FIELDS,
    defaultSort: { createdAt: -1 },
  });
  const filter = {};
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ username: pattern }, { email: pattern }];
  }
  if (req.query.role) filter.role = req.query.role;
  if (typeof req.query.active === 'boolean') filter.isActive = req.query.active;

  const [users, total] = await Promise.all([
    User.find(filter).select('-tokenVersion').sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json(paginatedResponse({ data: users.map(serializeUser), page, limit, total }));
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const role = req.body.role || ROLES.STAFF;
  assertAssignableRole(req, role);
  const generatedPassword = req.body.password ? null : generateTemporaryPassword();
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password || generatedPassword,
    role,
    employeeId: req.body.employeeId ?? null,
    internId: req.body.internId ?? null,
    mustChangePassword: Boolean(generatedPassword),
  });

  await req.recordAudit({ action: 'create', entity: 'User', entityId: user._id, after: safeUserSnapshot(user) });
  res.status(201).json({
    success: true,
    data: { user: serializeUser(user), ...(generatedPassword && { temporaryPassword: generatedPassword }) },
  });
});

export const updateAdminUser = asyncHandler(async (req, res) => {
  const user = await findUser(req.params.id);
  const before = safeUserSnapshot(user);
  const changes = {};

  if (req.body.role && req.body.role !== user.role) {
    if (!isSuperAdmin(req)) throw ApiError.forbidden('Only a super admin may change user roles');
    if (String(user._id) === req.user.id) throw ApiError.conflict('You cannot change your own role');
    if (user.role === ROLES.SUPER_ADMIN && req.body.role !== ROLES.SUPER_ADMIN) {
      await assertNotLastActiveSuperAdmin(user);
    }
    changes.role = req.body.role;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
    if (String(user._id) === req.user.id && req.body.isActive === false) {
      throw ApiError.conflict('You cannot deactivate your own account');
    }
    await assertNotLastActiveSuperAdmin(user, req.body.isActive);
    if (req.body.isActive !== user.isActive) changes.isActive = req.body.isActive;
  }

  for (const field of ['username', 'email', 'employeeId', 'internId']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
  }
  if (!Object.keys(changes).length) throw ApiError.badRequest('No changes were supplied');

  Object.assign(user, changes);
  if (changes.role || Object.prototype.hasOwnProperty.call(changes, 'isActive')) user.tokenVersion += 1;
  await user.save();

  const after = safeUserSnapshot(user);
  const action = changes.role ? 'role_change' : changes.isActive === true ? 'activate' : changes.isActive === false ? 'deactivate' : 'update';
  await req.recordAudit({ action, entity: 'User', entityId: user._id, before, after });
  res.status(200).json({ success: true, data: { user: serializeUser(user) } });
});

export const resetAdminUserPassword = asyncHandler(async (req, res) => {
  const user = await findUser(req.params.id);
  const temporaryPassword = req.body.password || generateTemporaryPassword();
  user.password = temporaryPassword;
  user.mustChangePassword = true;
  user.tokenVersion += 1;
  await user.save();
  await req.recordAudit({ action: 'password_reset', entity: 'User', entityId: user._id, after: safeUserSnapshot(user) });
  res.status(200).json({ success: true, data: { user: serializeUser(user), temporaryPassword } });
});

export const bulkDeactivateAdminUsers = asyncHandler(async (req, res) => {
  const ids = [...new Set(req.body.userIds.map(String))];
  if (ids.includes(req.user.id)) throw ApiError.conflict('You cannot deactivate your own account');
  const users = await User.find({ _id: { $in: ids }, isActive: true });
  const activeSuperAdmins = users.filter((user) => user.role === ROLES.SUPER_ADMIN).length;
  const totalActiveSuperAdmins = await User.countDocuments({ role: ROLES.SUPER_ADMIN, isActive: true });
  if (activeSuperAdmins > 0 && activeSuperAdmins >= totalActiveSuperAdmins) {
    throw ApiError.conflict('The last active super admin cannot be deactivated');
  }

  for (const user of users) {
    const before = safeUserSnapshot(user);
    user.isActive = false;
    user.tokenVersion += 1;
    await user.save();
    await req.recordAudit({ action: 'bulk_deactivate', entity: 'User', entityId: user._id, before, after: safeUserSnapshot(user) });
  }

  res.status(200).json({ success: true, data: { deactivated: users.length } });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultSort: { createdAt: -1 } });
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.actor) filter.userId = req.query.actor;
  if (req.query.entityId) filter.entityId = req.query.entityId;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = req.query.from;
    if (req.query.to) filter.createdAt.$lte = req.query.to;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('userId', 'username email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  const data = logs.map((log) => ({
    _id: log._id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    before: log.before,
    after: log.after,
    createdAt: log.createdAt,
    actor: log.userId ? { _id: log.userId._id, username: log.userId.username, email: log.userId.email, role: log.userId.role } : null,
  }));
  res.status(200).json(paginatedResponse({ data, page, limit, total }));
});

export { USER_ROLES };
