import mongoose from 'mongoose';
import { USER_ROLES } from './User.js';

export const ANNOUNCEMENT_CATEGORIES = [
  'news',
  'urgent',
  'event',
  'holiday',
  'training',
  'welcome',
  'maintenance',
];

export const CONTENT_STATUSES = ['draft', 'published', 'archived'];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [500, 'Summary must not exceed 500 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    coverImagePublicId: {
      type: String,
      default: '',
      select: false,
    },
    category: {
      type: String,
      enum: ANNOUNCEMENT_CATEGORIES,
      default: 'news',
    },
    priority: {
      type: Number,
      min: [0, 'Priority must be 0 or greater'],
      max: [10, 'Priority must not exceed 10'],
      default: 0,
    },
    /** Empty array means visible to every authenticated role. */
    targetRoles: {
      type: [{ type: String, enum: USER_ROLES }],
      default: [],
    },
    publishAt: {
      type: Date,
      default: Date.now,
    },
    expireAt: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return !value || !this.publishAt || value > this.publishAt;
        },
        message: 'Expiry date must be after the publish date',
      },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: 'draft',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

announcementSchema.index({ title: 'text', summary: 'text', content: 'text' });
announcementSchema.index({ status: 1, publishAt: -1 });
announcementSchema.index({ isPinned: -1, publishAt: -1 });

/** Live right now: published, past its publish time, and not yet expired. */
announcementSchema.virtual('isVisible').get(function () {
  const now = Date.now();
  if (this.status !== 'published') return false;
  if (this.publishAt && now < this.publishAt.getTime()) return false;
  if (this.expireAt && now > this.expireAt.getTime()) return false;
  return true;
});

/**
 * Filter for announcements a given role should currently see.
 * Combines status, schedule window and role targeting in one place.
 */
announcementSchema.statics.visibleToRoleFilter = function (role) {
  const now = new Date();
  return {
    status: 'published',
    publishAt: { $lte: now },
    $and: [
      { $or: [{ expireAt: null }, { expireAt: { $gt: now } }] },
      { $or: [{ targetRoles: { $size: 0 } }, { targetRoles: role }] },
    ],
  };
};

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
