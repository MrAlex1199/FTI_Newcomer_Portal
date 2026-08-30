import mongoose from 'mongoose';

export const INTERN_STATUSES = ['upcoming', 'active', 'completed'];

const internSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [80, 'First name must not exceed 80 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [80, 'Last name must not exceed 80 characters'],
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, 'Nickname must not exceed 50 characters'],
      default: '',
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
      maxlength: [200, 'University must not exceed 200 characters'],
    },
    faculty: {
      type: String,
      trim: true,
      maxlength: [200, 'Faculty must not exceed 200 characters'],
      default: '',
    },
    major: {
      type: String,
      trim: true,
      maxlength: [200, 'Major must not exceed 200 characters'],
      default: '',
    },
    year: {
      type: Number,
      min: [1, 'Study year must be at least 1'],
      max: [8, 'Study year must not exceed 8'],
      default: null,
    },
    /**
     * Age only - full birthdate is deliberately not stored (spec section 5.1
     * privacy recommendation). Requires privacyConsent to be surfaced publicly.
     */
    age: {
      type: Number,
      min: [15, 'Age must be at least 15'],
      max: [80, 'Age must not exceed 80'],
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternBatch',
      required: [true, 'Batch is required'],
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
    profileImage: {
      type: String,
      default: '',
    },
    profileImagePublicId: {
      type: String,
      default: '',
      select: false,
    },
    shortBio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Short bio must not exceed 1000 characters'],
      default: '',
    },
    projectTitle: {
      type: String,
      trim: true,
      maxlength: [250, 'Project title must not exceed 250 characters'],
      default: '',
    },
    /** Knowledge transfer for the next cohort (spec section 15). */
    lessonsLearned: {
      type: String,
      trim: true,
      maxlength: [3000, 'Lessons learned must not exceed 3000 characters'],
      default: '',
    },
    adviceForNextBatch: {
      type: String,
      trim: true,
      maxlength: [3000, 'Advice must not exceed 3000 characters'],
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    /** The data subject must opt in before optional personal fields are shown. */
    privacyConsent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

internSchema.index({
  firstName: 'text',
  lastName: 'text',
  nickname: 'text',
  university: 'text',
  major: 'text',
  projectTitle: 'text',
});
internSchema.index({ batchId: 1, isPublished: 1 });
internSchema.index({ departmentId: 1 });
internSchema.index({ mentorId: 1 });
internSchema.index({ startDate: 1, endDate: 1 });

internSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/**
 * Derived from the date range so it always reflects reality. Filtering by
 * status in queries is done with date comparisons, not this virtual.
 */
internSchema.virtual('status').get(function () {
  const now = Date.now();
  if (this.startDate && now < this.startDate.getTime()) return 'upcoming';
  if (this.endDate && now > this.endDate.getTime()) return 'completed';
  return 'active';
});

/** Number of days the internship runs for, inclusive of both end days. */
internSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((this.endDate - this.startDate) / msPerDay) + 1;
});

/**
 * Translate a status keyword into the date filter that expresses it.
 * Keeps status filtering consistent between controllers.
 */
internSchema.statics.statusFilter = function (status) {
  const now = new Date();
  if (status === 'upcoming') return { startDate: { $gt: now } };
  if (status === 'completed') return { endDate: { $lt: now } };
  if (status === 'active') return { startDate: { $lte: now }, endDate: { $gte: now } };
  return {};
};

const Intern = mongoose.model('Intern', internSchema);

export default Intern;
