import { Policy, AuditLog, POLICY_CATEGORIES, CONTENT_STATUSES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const SORT_FIELDS = ['priority', 'effectiveDate', 'updatedAt', 'createdAt', 'title'];
const canManage = (req) => can(req.user.role, 'policies:manage');

const policyPayload = (body) => {
  const fields = ['title', 'summary', 'content', 'category', 'priority', 'version', 'effectiveDate', 'attachmentUrl', 'status'];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
};

const visibleFilter = (req) => {
  if (canManage(req)) {
    if (req.query.status) return { status: req.query.status };
    if (req.query.published === 'true') return { status: 'published' };
    if (req.query.published === 'false') return { status: { $ne: 'published' } };
    return {};
  }
  return { status: 'published' };
};

const serializePolicy = (policy) => policy.toObject({ virtuals: true });

const auditContentChange = async ({ req, policy, before, action = 'update' }) => {
  await AuditLog.record({
    userId: req.user.id,
    action,
    entity: 'Policy',
    entityId: policy._id,
    before,
    after: policy.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
};

export const listPolicyCategories = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: { categories: POLICY_CATEGORIES } });
});

export const listPolicies = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: SORT_FIELDS,
    defaultSort: { priority: -1, effectiveDate: -1, title: 1 },
  });
  const filter = visibleFilter(req);
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.category) filter.category = req.query.category;

  const [policies, total] = await Promise.all([
    Policy.find(filter)
      .populate('updatedBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Policy.countDocuments(filter),
  ]);

  res.status(200).json(paginatedResponse({
    data: policies.map(serializePolicy),
    page,
    limit,
    total,
  }));
});

export const getPolicy = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...visibleFilter(req) };
  const policy = await Policy.findOne(filter).populate('updatedBy', 'username');
  if (!policy) throw ApiError.notFound('Policy not found');
  res.status(200).json({ success: true, data: { policy: serializePolicy(policy) } });
});

export const createPolicy = asyncHandler(async (req, res) => {
  const payload = policyPayload(req.body);
  const policy = await Policy.create({ ...payload, updatedBy: req.user.id });
  await policy.populate('updatedBy', 'username');
  await auditContentChange({ req, policy, before: null, action: policy.status === 'published' ? 'publish' : 'create' });
  res.status(201).json({ success: true, data: { policy: serializePolicy(policy) } });
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw ApiError.notFound('Policy not found');

  const before = policy.toObject();
  const payload = policyPayload(req.body);
  Object.assign(policy, payload, { updatedBy: req.user.id });
  await policy.save();
  await policy.populate('updatedBy', 'username');

  const previousStatus = before.status;
  const nextStatus = policy.status;
  const action = previousStatus !== nextStatus && nextStatus === 'published'
    ? 'publish'
    : previousStatus === 'published' && nextStatus !== 'published'
      ? 'unpublish'
      : 'update';
  await auditContentChange({ req, policy, before, action });
  res.status(200).json({ success: true, data: { policy: serializePolicy(policy) } });
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw ApiError.notFound('Policy not found');
  const before = policy.toObject();
  await policy.deleteOne();
  await auditContentChange({ req, policy, before, action: 'delete' });
  res.status(200).json({ success: true, message: 'Policy deleted' });
});

export { CONTENT_STATUSES };
