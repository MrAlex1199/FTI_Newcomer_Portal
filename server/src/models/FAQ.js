import mongoose from 'mongoose';

export const FAQ_CATEGORIES = [
  'first_day',
  'facilities',
  'it',
  'hr',
  'policy',
  'general',
];

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [300, 'Question must not exceed 300 characters'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      maxlength: [5000, 'Answer must not exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: FAQ_CATEGORIES,
      default: 'general',
    },
    tags: {
      type: [String],
      default: [],
    },
    /** Manual ordering within a category - lower values appear first. */
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });
faqSchema.index({ category: 1, sortOrder: 1 });
faqSchema.index({ isPublished: 1, sortOrder: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;
