import { InternBatch, Intern, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { can } from '../config/permissions.js';
import { deleteImage, uploadImage } from '../utils/imageUpload.js';

const BATCH_SORT_FIELDS = ['createdAt', 'code', 'title', 'year', 'startDate', 'endDate'];
const isManager = (req) => can(req.user.role, 'interns:manage');
const visibleInternFilter = (req) => (isManager(req) ? {} : { isPublished: true });

const statusFilter = (status) => {
  const now = new Date();
  if (status === 'upcoming') return { startDate: { $gt: now } };
  if (status === 'completed') return { endDate: { $lt: now } };
  if (status === 'active') return { startDate: { $lte: now }, endDate: { $gte: now } };
  return {};
};

const serializeBatch = (batch, internCount, interns) => {
  const data = batch.toObject({ virtuals: true });
  data.internCount = internCount;
  if (interns) data.interns = interns;
  return data;
};

const batchPayload = (body) => {
  const fields = ['code', 'title', 'year', 'sequence', 'startDate', 'endDate', 'description'];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
};

const assertDateOrder = (startDate, endDate) => {
  if (new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest('End date must be on or after the start date', { endDate: 'End date must be on or after start date' });
  }
};

export const listInternBatches = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: BATCH_SORT_FIELDS,
    defaultSort: { year: -1, sequence: -1 },
  });
  const filter = { ...statusFilter(req.query.status) };
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [batches, total] = await Promise.all([
    InternBatch.find(filter).sort(sort).skip(skip).limit(limit),
    InternBatch.countDocuments(filter),
  ]);
  const data = await Promise.all(
    batches.map(async (batch) => {
      const internCount = await Intern.countDocuments({ batchId: batch._id, ...visibleInternFilter(req) });
      return serializeBatch(batch, internCount);
    })
  );

  res.status(200).json(paginatedResponse({ data, page, limit, total }));
});

export const getInternBatch = asyncHandler(async (req, res) => {
  const batch = await InternBatch.findById(req.params.id);
  if (!batch) throw ApiError.notFound('Intern batch not found');

  const interns = await Intern.find({ batchId: batch._id, ...visibleInternFilter(req) })
    .populate('departmentId', 'name code')
    .populate('mentorId', 'firstName lastName employeeCode')
    .sort({ lastName: 1, firstName: 1 });

  res.status(200).json({
    success: true,
    data: { batch: serializeBatch(batch, interns.length, interns) },
  });
});

export const createInternBatch = asyncHandler(async (req, res) => {
  const payload = batchPayload(req.body);
  assertDateOrder(payload.startDate, payload.endDate);

  let uploaded;
  let batch;
  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/batches');
    batch = await InternBatch.create({ ...payload, ...(uploaded && { groupPhoto: uploaded.url, groupPhotoPublicId: uploaded.publicId }) });
    await AuditLog.record({
      userId: req.user.id,
      action: 'create',
      entity: 'InternBatch',
      entityId: batch._id,
      after: batch.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    res.status(201).json({ success: true, data: { batch: serializeBatch(batch, 0) } });
  } catch (error) {
    if (uploaded && !batch) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const updateInternBatch = asyncHandler(async (req, res) => {
  const batch = await InternBatch.findById(req.params.id).select('+groupPhotoPublicId');
  if (!batch) throw ApiError.notFound('Intern batch not found');

  const before = batch.toObject();
  const payload = batchPayload(req.body);
  const startDate = payload.startDate ?? batch.startDate;
  const endDate = payload.endDate ?? batch.endDate;
  assertDateOrder(startDate, endDate);

  let uploaded;
  let saved = false;
  if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/batches');
  try {
    Object.assign(batch, payload);
    if (uploaded) {
      batch.groupPhoto = uploaded.url;
      batch.groupPhotoPublicId = uploaded.publicId;
    }
    await batch.save();
    saved = true;

    const internCount = await Intern.countDocuments({ batchId: batch._id, ...visibleInternFilter(req) });
    await AuditLog.record({
      userId: req.user.id,
      action: 'update',
      entity: 'InternBatch',
      entityId: batch._id,
      before,
      after: batch.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    if (uploaded && before.groupPhotoPublicId) await deleteImage(before.groupPhotoPublicId);
    res.status(200).json({ success: true, data: { batch: serializeBatch(batch, internCount) } });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const deleteInternBatch = asyncHandler(async (req, res) => {
  const batch = await InternBatch.findById(req.params.id).select('+groupPhotoPublicId');
  if (!batch) throw ApiError.notFound('Intern batch not found');

  const internCount = await Intern.countDocuments({ batchId: batch._id });
  if (internCount) {
    throw ApiError.conflict(`Cannot delete a batch with ${internCount} intern${internCount === 1 ? '' : 's'} assigned`);
  }

  const before = batch.toObject();
  await batch.deleteOne();
  await deleteImage(batch.groupPhotoPublicId);
  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'InternBatch',
    entityId: req.params.id,
    before,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
  res.status(200).json({ success: true, message: 'Intern batch deleted' });
});
