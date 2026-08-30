import mongoose from 'mongoose';
import { CONTENT_STATUSES } from './Announcement.js';

export const POLICY_CATEGORIES = [
  'dress_code',
  'working_hours',
  'leave',
  'computer_use',
  'internet_use',
  'email_use',
  'confidentiality',
  'software',
  'photography',
  'equipment',
  'cybersecurity',
  'privacy',
  'safety',
  'emergency',
  'other',
];

const policySchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: POLICY_CATEGORIES,
      default: 'other',
    },
    /** Display weight - higher values surface first in the policy list. */
    priority: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    version: {
      type: String,
      trim: true,
      default: '1.0',
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachmentPublicId: {
      type: String,
      default: '',
      select: false,
    },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: 'draft',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

policySchema.index({ title: 'text', summary: 'text', content: 'text' });
policySchema.index({ category: 1, status: 1 });
policySchema.index({ status: 1, priority: -1, effectiveDate: -1 });

const Policy = mongoose.model('Policy', policySchema);

export default Policy;
