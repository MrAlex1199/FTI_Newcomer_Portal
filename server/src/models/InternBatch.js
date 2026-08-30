import mongoose from 'mongoose';

export const BATCH_STATUSES = ['upcoming', 'active', 'completed'];

const internBatchSchema = new mongoose.Schema(
  {
    /** Human-readable batch code, e.g. "2026/01". */
    code: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      trim: true,
      maxlength: [20, 'Batch code must not exceed 20 characters'],
    },
    title: {
      type: String,
      required: [true, 'Batch title is required'],
      trim: true,
      maxlength: [150, 'Batch title must not exceed 150 characters'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year must be 2100 or earlier'],
    },
    /** Sequence within the year: 1 for the first batch of the year, 2 for the next, etc. */
    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      min: [1, 'Sequence must be at least 1'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be on or after the start date',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
      default: '',
    },
    groupPhoto: {
      type: String,
      default: '',
    },
    groupPhotoPublicId: {
      type: String,
      default: '',
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

internBatchSchema.index({ year: -1, sequence: -1 });
internBatchSchema.index({ startDate: 1, endDate: 1 });
internBatchSchema.index({ code: 'text', title: 'text', description: 'text' });

/**
 * Status is derived from the date range rather than stored, so it can never
 * drift out of sync with the actual schedule.
 */
internBatchSchema.virtual('status').get(function () {
  const now = Date.now();
  if (this.startDate && now < this.startDate.getTime()) return 'upcoming';
  if (this.endDate && now > this.endDate.getTime()) return 'completed';
  return 'active';
});

internBatchSchema.virtual('interns', {
  ref: 'Intern',
  localField: '_id',
  foreignField: 'batchId',
});

const InternBatch = mongoose.model('InternBatch', internBatchSchema);

export default InternBatch;
