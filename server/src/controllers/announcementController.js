import { Announcement, AuditLog, ANNOUNCEMENT_CATEGORIES, CONTENT_STATUSES } from '../models/index.js';
import { USER_ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { deleteImage, uploadImage } from '../utils/imageUpload.js';

const SORT_FIELDS = ['priority', 'publishAt', 'expireAt', 'createdAt', 'updatedAt', 'title'];
const canManage = (req) => can(req.user.role, 'announcements:manage');

const announcementPayload = (body) => {
  const fields = ['title', 'summary', 'content', 'coverImage', 'category', 'priority', 'targetRoles', 'publishAt', 'expireAt', 'isPinned', 'status'];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
  if (typeof payload.targetRoles === 'string') payload.targetRoles = [payload.targetRoles];
  if (typeof payload.priority === 'string' && payload.priority !== '') payload.priority = Number(payload.priority);
  if (typeof payload.isPinned === 'string') payload.isPinned = payload.isPinned === 'true';
  if (payload.publishAt && !(payload.publishAt instanceof Date)) payload.publishAt = new Date(payload.publishAt);
  if (payload.expireAt && !(payload.expireAt instanceof Date)) payload.expireAt = new Date(payload.expireAt);
  return payload;
};

const statusFor = (announcement, now = Date.now()) => {
  if (announcement.status === 'archived') return 'archived';
  if (announcement.status === 'draft') return 'draft';
  if (announcement.publishAt && announcement.publishAt.getTime() > now) return 'scheduled';
  if (announcement.expireAt && announcement.expireAt.getTime() <= now) return 'expired';
  return 'published';
};

const snapshot = (announcement) => {
  const value = announcement?.toObject ? announcement.toObject() : announcement;
  if (!value) return null;
  const plain = { ...value };
  delete plain.coverImagePublicId;
  return plain;
};

const serializeAnnouncement = (announcement) => ({
  ...snapshot(announcement),
  displayStatus: statusFor(announcement),
});

const auditAnnouncement = ({ req, action, announcement, before = null }) => AuditLog.record({
  userId: req.user.id,
  action,
  entity: 'Announcement',
  entityId: announcement?._id || null,
  before,
  after: snapshot(announcement),
  ip: req.ip,
  userAgent: req.get('user-agent') || '',
});

const managerStatusFilter = (status) => {
  const now = new Date();
  if (!status) return {};
  if (CONTENT_STATUSES.includes(status)) return { status };
  if (status === 'scheduled') return { status: 'published', publishAt: { $gt: now } };
  if (status === 'expired') return { status: 'published', expireAt: { $ne: null, $lte: now } };
  return {};
};

const visibleFilter = (req) => (req.query.audience === 'live'
  ? Announcement.visibleToRoleFilter(req.user.role)
  : canManage(req)
    ? managerStatusFilter(req.query.status)
    : Announcement.visibleToRoleFilter(req.user.role));

const applyFilters = (req) => {
  const filter = visibleFilter(req);
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.category) filter.category = req.query.category;
  return filter;
};

export const listAnnouncementCategories = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      categories: ANNOUNCEMENT_CATEGORIES,
      roles: USER_ROLES,
      statuses: [...CONTENT_STATUSES, 'scheduled', 'expired'],
    },
  });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: SORT_FIELDS,
    defaultSort: { priority: -1, publishAt: -1, createdAt: -1 },
  });
  const filter = applyFilters(req);
  const orderedSort = { isPinned: -1, ...sort };

  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate('authorId', 'username').sort(orderedSort).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  res.status(200).json(paginatedResponse({
    data: announcements.map(serializeAnnouncement),
    page,
    limit,
    total,
  }));
});

export const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({ _id: req.params.id, ...visibleFilter(req) })
    .populate('authorId', 'username');
  if (!announcement) throw ApiError.notFound('Announcement not found');
  res.status(200).json({ success: true, data: { announcement: serializeAnnouncement(announcement) } });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const payload = announcementPayload(req.body);
  if (!Object.prototype.hasOwnProperty.call(payload, 'status')) payload.status = 'draft';

  let uploaded;
  let announcement;
  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/announcements');
    announcement = await Announcement.create({
      ...payload,
      ...(uploaded && { coverImage: uploaded.url, coverImagePublicId: uploaded.publicId }),
      authorId: req.user.id,
    });
    await announcement.populate('authorId', 'username');
    await auditAnnouncement({ req, action: announcement.status === 'published' ? 'publish' : 'create', announcement });
    res.status(201).json({ success: true, data: { announcement: serializeAnnouncement(announcement) } });
  } catch (error) {
    if (uploaded && !announcement) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).select('+coverImagePublicId');
  if (!announcement) throw ApiError.notFound('Announcement not found');

  const before = snapshot(announcement);
  const previousStatus = announcement.status;
  const previousCoverImagePublicId = announcement.coverImagePublicId;
  const payload = announcementPayload(req.body);
  let uploaded;
  let saved = false;

  try {
    if (req.file) uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/announcements');
    Object.assign(announcement, payload);
    if (uploaded) {
      announcement.coverImage = uploaded.url;
      announcement.coverImagePublicId = uploaded.publicId;
    }
    await announcement.save();
    saved = true;
    await announcement.populate('authorId', 'username');

    const action = previousStatus !== announcement.status && announcement.status === 'published'
      ? 'publish'
      : previousStatus === 'published' && announcement.status !== 'published'
        ? 'unpublish'
        : 'update';
    await auditAnnouncement({ req, action, announcement, before });

    if ((uploaded || Object.prototype.hasOwnProperty.call(payload, 'coverImage')) && previousCoverImagePublicId) {
      await deleteImage(previousCoverImagePublicId);
    }
    res.status(200).json({ success: true, data: { announcement: serializeAnnouncement(announcement) } });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).select('+coverImagePublicId');
  if (!announcement) throw ApiError.notFound('Announcement not found');
  const before = snapshot(announcement);
  const publicId = announcement.coverImagePublicId;
  await announcement.deleteOne();
  await deleteImage(publicId);
  await auditAnnouncement({ req, action: 'delete', announcement, before });
  res.status(200).json({ success: true, message: 'Announcement deleted' });
});
