import { AuditLog, Employee, Intern, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteImage, uploadImage } from '../utils/imageUpload.js';

const recordFromUser = (user) => {
  if (user.employeeId) return { type: 'employee', record: user.employeeId };
  if (user.internId) return { type: 'intern', record: user.internId };
  return { type: null, record: null };
};

const serializeProfile = (user) => {
  const { type, record } = recordFromUser(user);
  const source = record || user;
  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    recordType: type,
    profile: {
      _id: source._id,
      firstName: source.firstName || '',
      lastName: source.lastName || '',
      nickname: source.nickname || '',
      profileImage: source.profileImage || '',
    },
  };
};

const cleanSnapshot = (document) => {
  const data = document.toObject ? document.toObject() : { ...document };
  delete data.password;
  delete data.profileImagePublicId;
  delete data.tokenVersion;
  return data;
};

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('employeeId')
    .populate('internId');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  res.status(200).json({ success: true, data: serializeProfile(user) });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+profileImagePublicId');
  if (!user) throw ApiError.unauthorized('User no longer exists');

  const hasTextChanges = ['email', 'firstName', 'lastName', 'nickname']
    .some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
  if (!hasTextChanges && !req.file) {
    throw ApiError.badRequest('No profile changes were supplied');
  }

  const beforeUser = cleanSnapshot(user);
  let linkedRecord = null;
  let recordType = null;
  let previousImagePublicId = '';

  if (user.employeeId) {
    linkedRecord = await Employee.findById(user.employeeId).select('+profileImagePublicId');
    recordType = 'Employee';
  } else if (user.internId) {
    linkedRecord = await Intern.findById(user.internId).select('+profileImagePublicId');
    recordType = 'Intern';
  }

  if ((user.employeeId || user.internId) && !linkedRecord) {
    throw ApiError.conflict('The linked directory profile no longer exists');
  }

  const beforeRecord = linkedRecord ? cleanSnapshot(linkedRecord) : null;
  let uploaded;
  let saved = false;

  try {
    if (req.file) {
      uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/profiles');
      previousImagePublicId = linkedRecord?.profileImagePublicId || user.profileImagePublicId || '';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) user.email = req.body.email;

    const target = linkedRecord || user;
    for (const field of ['firstName', 'lastName', 'nickname']) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) target[field] = req.body[field];
    }
    if (uploaded) {
      target.profileImage = uploaded.url;
      target.profileImagePublicId = uploaded.publicId;
    }

    if (linkedRecord) await linkedRecord.save();
    await user.save();
    saved = true;

    await AuditLog.record({
      userId: user._id,
      action: 'update',
      entity: recordType || 'User',
      entityId: linkedRecord?._id || user._id,
      before: { user: beforeUser, profile: beforeRecord },
      after: { user: cleanSnapshot(user), profile: linkedRecord ? cleanSnapshot(linkedRecord) : cleanSnapshot(user) },
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });

    if (uploaded && previousImagePublicId) await deleteImage(previousImagePublicId);

    const updated = await User.findById(user._id)
      .populate('employeeId')
      .populate('internId');
    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: serializeProfile(updated) });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});
