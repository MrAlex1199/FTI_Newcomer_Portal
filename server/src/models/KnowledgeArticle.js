import mongoose from 'mongoose';
import { USER_ROLES } from './User.js';
import { CONTENT_STATUSES } from './Announcement.js';

/**
 * One model serves both the onboarding guide and the IT help centre.
 * `category` picks the section, `subcategory` the topic within it.
 */
export const ARTICLE_CATEGORIES = [
  'getting_started',
  'it_help',
  'company_info',
  'knowledge_transfer',
];

export const GETTING_STARTED_SECTIONS = ['first_day', 'first_week', 'before_leaving'];

export const IT_HELP_TOPICS = [
  'windows',
  'printer',
  'network',
  'wifi',
  'email',
  'password',
  'office_suite',
  'vpn',
  'shared_folder',
  'browser',
  'software_request',
];

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and hyphens'],
    },
    category: {
      type: String,
      enum: ARTICLE_CATEGORIES,
      required: [true, 'Category is required'],
    },
    /** Section for getting_started, or topic for it_help. Free-form for other categories. */
    subcategory: {
      type: String,
      trim: true,
      default: '',
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
    tags: {
      type: [String],
      default: [],
    },
    /** Empty array means visible to every authenticated role. */
    targetRoles: {
      type: [{ type: String, enum: USER_ROLES }],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    /** Simple helpfulness counters for the IT help centre. */
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: 'draft',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

knowledgeArticleSchema.index({
  title: 'text',
  summary: 'text',
  content: 'text',
  tags: 'text',
});
knowledgeArticleSchema.index({ category: 1, subcategory: 1, sortOrder: 1 });
knowledgeArticleSchema.index({ status: 1, category: 1 });

/** Ratio of helpful votes, or null when nobody has voted yet. */
knowledgeArticleSchema.virtual('helpfulRatio').get(function () {
  const total = this.helpfulCount + this.notHelpfulCount;
  if (total === 0) return null;
  return Number((this.helpfulCount / total).toFixed(2));
});

const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

export default KnowledgeArticle;
