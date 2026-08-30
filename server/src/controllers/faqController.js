import { FAQ, AuditLog, FAQ_CATEGORIES } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const SORT_FIELDS = ['category', 'sortOrder', 'createdAt', 'updatedAt', 'question'];
const canManage = (req) => can(req.user.role, 'faq:manage');

const faqPayload = (body) => {
  const fields = ['question', 'answer', 'category', 'tags', 'sortOrder', 'isPublished'];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
};

const visibleFilter = (req) => {
  if (canManage(req)) {
    if (req.query.published === 'true') return { isPublished: true };
    if (req.query.published === 'false') return { isPublished: false };
    return {};
  }
  return { isPublished: true };
};

const serializeFaq = (faq) => faq.toObject({ virtuals: true });

const auditFaqChange = ({ req, action, faq = null, before = null, after = null, entityId = null }) => AuditLog.record({
  userId: req.user.id,
  action,
  entity: 'FAQ',
  entityId: entityId || faq?._id || null,
  before,
  after: after || faq?.toObject() || null,
  ip: req.ip,
  userAgent: req.get('user-agent') || '',
});

export const listFaqCategories = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: { categories: FAQ_CATEGORIES } });
});

export const listFaqs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: SORT_FIELDS,
    defaultSort: { category: 1, sortOrder: 1, question: 1 },
  });
  const filter = visibleFilter(req);
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.category) filter.category = req.query.category;

  const [faqs, total] = await Promise.all([
    FAQ.find(filter).sort(sort).skip(skip).limit(limit),
    FAQ.countDocuments(filter),
  ]);
  res.status(200).json(paginatedResponse({
    data: faqs.map(serializeFaq),
    page,
    limit,
    total,
  }));
});

export const getFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findOne({ _id: req.params.id, ...visibleFilter(req) });
  if (!faq) throw ApiError.notFound('FAQ not found');
  res.status(200).json({ success: true, data: { faq: serializeFaq(faq) } });
});

export const createFaq = asyncHandler(async (req, res) => {
  const payload = faqPayload(req.body);
  // New entries are drafts unless the content manager explicitly publishes them.
  if (!Object.prototype.hasOwnProperty.call(payload, 'isPublished')) payload.isPublished = false;
  const faq = await FAQ.create(payload);
  await auditFaqChange({ req, action: faq.isPublished ? 'publish' : 'create', faq });
  res.status(201).json({ success: true, data: { faq: serializeFaq(faq) } });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) throw ApiError.notFound('FAQ not found');
  const before = faq.toObject();
  const payload = faqPayload(req.body);
  Object.assign(faq, payload);
  await faq.save();
  const action = before.isPublished !== faq.isPublished
    ? (faq.isPublished ? 'publish' : 'unpublish')
    : 'update';
  await auditFaqChange({ req, action, faq, before });
  res.status(200).json({ success: true, data: { faq: serializeFaq(faq) } });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) throw ApiError.notFound('FAQ not found');
  const before = faq.toObject();
  await faq.deleteOne();
  await auditFaqChange({ req, action: 'delete', faq, before });
  res.status(200).json({ success: true, message: 'FAQ deleted' });
});

export const reorderFaqs = asyncHandler(async (req, res) => {
  const { category, items } = req.body;
  const ids = items.map((item) => item.id);
  const faqs = await FAQ.find({ _id: { $in: ids } }).select('_id category sortOrder');
  if (faqs.length !== ids.length) throw ApiError.badRequest('All FAQ ids must exist');
  if (new Set(ids).size !== ids.length) throw ApiError.badRequest('FAQ ids must be unique');
  if (faqs.some((faq) => faq.category !== category)) {
    throw ApiError.badRequest('All reordered FAQs must belong to the selected category');
  }

  await FAQ.bulkWrite(items.map((item, index) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { sortOrder: index + 1 } },
    },
  })));

  await auditFaqChange({
    req,
    action: 'update',
    after: { category, orderedIds: ids },
  });
  const reordered = await FAQ.find({ category }).sort({ sortOrder: 1, question: 1 });
  res.status(200).json({ success: true, data: { faqs: reordered.map(serializeFaq) } });
});
