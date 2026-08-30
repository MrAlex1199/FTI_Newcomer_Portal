import { AuditLog, Feedback } from '../models/index.js';
import { FEEDBACK_STATUSES } from '../models/Feedback.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { paginatedResponse, parsePagination } from '../utils/pagination.js';

const FEEDBACK_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'category', 'rating'];

export const ticketNumber = (id) => `FB-${String(id).slice(-8).toUpperCase()}`;

/** Never include the full message or admin note in audit snapshots. */
export const auditFeedbackSnapshot = (feedback) => ({
  _id: feedback._id,
  userId: feedback.userId ?? null,
  category: feedback.category,
  rating: feedback.rating ?? null,
  status: feedback.status,
  resolvedBy: feedback.resolvedBy ?? null,
  resolvedAt: feedback.resolvedAt ?? null,
});

const serializeFeedback = (feedback, includeAdminFields = true) => {
  const value = typeof feedback.toObject === 'function' ? feedback.toObject() : feedback;
  const user = value.userId && typeof value.userId === 'object'
    ? { _id: value.userId._id, username: value.userId.username, role: value.userId.role }
    : value.userId || null;
  const resolvedBy = value.resolvedBy && typeof value.resolvedBy === 'object'
    ? { _id: value.resolvedBy._id, username: value.resolvedBy.username }
    : value.resolvedBy || null;
  return {
    _id: value._id,
    ticketNumber: ticketNumber(value._id),
    category: value.category,
    message: value.message,
    rating: value.rating ?? null,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...(includeAdminFields && {
      adminNote: value.adminNote || '',
      resolvedBy,
      resolvedAt: value.resolvedAt || null,
      user,
    }),
  };
};

export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.create({
    userId: req.user.id,
    category: req.body.category,
    message: req.body.message,
    rating: req.body.rating ?? null,
  });

  await AuditLog.record({
    userId: req.user.id,
    action: 'create',
    entity: 'Feedback',
    entityId: feedback._id,
    after: auditFeedbackSnapshot(feedback),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({ success: true, data: { feedback: serializeFeedback(feedback, false) } });
});

export const listFeedback = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: FEEDBACK_SORT_FIELDS,
    defaultSort: { createdAt: -1 },
  });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [feedbackItems, total] = await Promise.all([
    Feedback.find(filter)
      .populate('userId', 'username role')
      .populate('resolvedBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Feedback.countDocuments(filter),
  ]);

  res.status(200).json(paginatedResponse({
    data: feedbackItems.map((item) => serializeFeedback(item)),
    page,
    limit,
    total,
  }));
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound('Feedback not found');

  const before = auditFeedbackSnapshot(feedback);
  const nextStatus = req.body.status;
  feedback.status = nextStatus;
  if (Object.prototype.hasOwnProperty.call(req.body, 'adminNote')) feedback.adminNote = req.body.adminNote || '';

  if (nextStatus === 'resolved') {
    if (feedback.status !== 'resolved' || !feedback.resolvedBy) {
      feedback.resolvedBy = req.user.id;
      feedback.resolvedAt = new Date();
    }
  } else if (nextStatus !== 'resolved') {
    feedback.resolvedBy = null;
    feedback.resolvedAt = null;
  }

  await feedback.save();
  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'Feedback',
    entityId: feedback._id,
    before,
    after: auditFeedbackSnapshot(feedback),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  await feedback.populate('userId', 'username role');
  await feedback.populate('resolvedBy', 'username');
  res.status(200).json({ success: true, data: { feedback: serializeFeedback(feedback) } });
});

export { FEEDBACK_STATUSES };
