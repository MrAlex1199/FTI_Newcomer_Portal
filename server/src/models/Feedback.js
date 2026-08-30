import mongoose from 'mongoose';

export const FEEDBACK_CATEGORIES = [
  'missing_information',
  'unclear_guide',
  'first_day_issue',
  'suggestion',
  'bug',
  'other',
];

export const FEEDBACK_STATUSES = ['pending', 'in_review', 'resolved', 'dismissed'];

const feedbackSchema = new mongoose.Schema(
  {
    /** Null when submitted anonymously. */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
      default: 'other',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters'],
      maxlength: [2000, 'Message must not exceed 2000 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      default: null,
    },
    status: {
      type: String,
      enum: FEEDBACK_STATUSES,
      default: 'pending',
    },
    /** Internal note - never exposed to the submitter. */
    adminNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin note must not exceed 2000 characters'],
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
