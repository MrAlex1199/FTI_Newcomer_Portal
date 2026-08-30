import { Intern, InternBatch, Department, Employee, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { can } from '../config/permissions.js';
import { deleteImage, uploadImage } from '../utils/imageUpload.js';

const INTERN_SORT_FIELDS = ['createdAt', 'firstName', 'lastName', 'university', 'startDate', 'endDate'];
const isManager = (req) => can(req.user.role, 'interns:manage');
const visibilityFilter = (req) => (isManager(req) ? {} : { isPublished: true });
const POPULATE = [
  ['departmentId', 'name code'],
  ['batchId', 'code title year startDate endDate'],
  ['mentorId', 'firstName lastName employeeCode position'],
];

const populateIntern = (query) => POPULATE.reduce((current, [path, select]) => current.populate(path, select), query);

const serializeIntern = (intern, req) => {
  const data = intern.toObject({ virtuals: true });
  // Age is only returned when the intern has explicitly consented, or to admins.
  if (!isManager(req) && !data.privacyConsent) delete data.age;
  return data;
};

const internPayload = (body) => {
  const fields = [
    'firstName', 'lastName', 'nickname', 'university', 'faculty', 'major', 'year', 'age',
    'departmentId', 'mentorId', 'batchId', 'startDate', 'endDate', 'shortBio', 'projectTitle',
    'lessonsLearned', 'adviceForNextBatch', 'isPublished', 'privacyConsent',
  ];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
};

const assertReferences = async ({ departmentId, batchId, mentorId }) => {
  const [department, batch, mentor] = await Promise.all([
    Department.findById(departmentId).select('isActive'),
    InternBatch.findById(batchId).select('startDate endDate'),
    mentorId ? Employee.findById(mentorId).select('departmentId isActive') : null,
  ]);
  if (!department) throw ApiError.badRequest('The specified department does not exist');
  if (!department.isActive) throw ApiError.badRequest('Interns can only be assigned to active departments');
  if (!batch) throw ApiError.badRequest('The specified intern batch does not exist');
  if (mentorId && !mentor) throw ApiError.badRequest('The specified mentor does not exist');
  if (mentorId && !mentor.isActive) throw ApiError.badRequest('An inactive employee cannot mentor an intern');
  if (mentorId && String(mentor.departmentId) !== String(departmentId)) {
    throw ApiError.badRequest('The mentor must belong to the intern department', {
      mentorId: 'Mentor must belong to the intern department',
    });
  }
  return { batch };
};

const assertDateRange = (startDate, endDate, batch) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    throw ApiError.badRequest('End date must be on or after the start date', { endDate: 'End date must be on or after start date' });
  }
  if (start < batch.startDate || end > batch.endDate) {
    throw ApiError.badRequest('Intern dates must fall within the selected batch dates', {
      startDate: 'Dates must be within the batch timeline',
      endDate: 'Dates must be within the batch timeline',
    });
  }
};

export const listInterns = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: INTERN_SORT_FIELDS,
    defaultSort: { lastName: 1, firstName: 1 },
  });
  const filter = { ...visibilityFilter(req) };
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.department) filter.departmentId = req.query.department;
  if (req.query.batch) filter.batchId = req.query.batch;
  if (req.query.status) Object.assign(filter, Intern.statusFilter(req.query.status));
  if (isManager(req)) {
    if (req.query.published === 'true') filter.isPublished = true;
    if (req.query.published === 'false') filter.isPublished = false;
  }

  const [interns, total] = await Promise.all([
    populateIntern(Intern.find(filter)).sort(sort).skip(skip).limit(limit),
    Intern.countDocuments(filter),
  ]);
  res.status(200).json(paginatedResponse({
    data: interns.map((intern) => serializeIntern(intern, req)),
    page,
    limit,
    total,
  }));
});

export const getIntern = asyncHandler(async (req, res) => {
  const intern = await populateIntern(Intern.findById(req.params.id));
  if (!intern || (!isManager(req) && !intern.isPublished)) throw ApiError.notFound('Intern not found');
  res.status(200).json({ success: true, data: { intern: serializeIntern(intern, req) } });
});

export const createIntern = asyncHandler(async (req, res) => {
  const payload = internPayload(req.body);
  const { batch } = await assertReferences(payload);
  assertDateRange(payload.startDate, payload.endDate, batch);

  let uploaded;
  let intern;
  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/interns');
    intern = await Intern.create({ ...payload, ...(uploaded && { profileImage: uploaded.url, profileImagePublicId: uploaded.publicId }) });
    const populated = await populateIntern(Intern.findById(intern._id));
    await AuditLog.record({
      userId: req.user.id,
      action: 'create',
      entity: 'Intern',
      entityId: intern._id,
      after: intern.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    res.status(201).json({ success: true, data: { intern: serializeIntern(populated, req) } });
  } catch (error) {
    if (uploaded && !intern) await deleteImage(uploaded.publicId);
    throw error;
  }
});

const UPDATABLE_FIELDS = [
  'firstName', 'lastName', 'nickname', 'university', 'faculty', 'major', 'year', 'age',
  'departmentId', 'mentorId', 'batchId', 'startDate', 'endDate', 'shortBio', 'projectTitle',
  'lessonsLearned', 'adviceForNextBatch', 'isPublished', 'privacyConsent',
];

export const updateIntern = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.id).select('+profileImagePublicId');
  if (!intern) throw ApiError.notFound('Intern not found');

  const before = intern.toObject();
  const payload = internPayload(req.body);
  const next = { ...intern.toObject(), ...payload };
  const { batch } = await assertReferences({
    departmentId: next.departmentId,
    batchId: next.batchId,
    mentorId: next.mentorId,
  });
  assertDateRange(next.startDate, next.endDate, batch);

  let uploaded;
  let saved = false;
  if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/interns');
  try {
    for (const field of UPDATABLE_FIELDS) {
      if (field in payload) intern[field] = payload[field];
    }
    if (uploaded) {
      intern.profileImage = uploaded.url;
      intern.profileImagePublicId = uploaded.publicId;
    }
    await intern.save();
    saved = true;

    const populated = await populateIntern(Intern.findById(intern._id));
    await AuditLog.record({
      userId: req.user.id,
      action: 'update',
      entity: 'Intern',
      entityId: intern._id,
      before,
      after: intern.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    if (uploaded && before.profileImagePublicId) await deleteImage(before.profileImagePublicId);
    res.status(200).json({ success: true, data: { intern: serializeIntern(populated, req) } });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const deleteIntern = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.id).select('+profileImagePublicId');
  if (!intern) throw ApiError.notFound('Intern not found');
  const before = intern.toObject();
  await intern.deleteOne();
  await deleteImage(intern.profileImagePublicId);
  await AuditLog.record({
    userId: req.user.id,
    action: 'delete',
    entity: 'Intern',
    entityId: req.params.id,
    before,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
  res.status(200).json({ success: true, message: 'Intern deleted' });
});
