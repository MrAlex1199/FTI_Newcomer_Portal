import mongoose from 'mongoose';

/**
 * Visibility levels from spec section 33 (Privacy / PDPA-oriented design).
 * Applied per-field so the API layer can strip values the requester may not see.
 */
export const VISIBILITY_LEVELS = [
  'public_internal',
  'staff_only',
  'intern_only',
  'admin_only',
  'private',
];

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Employee code must not exceed 20 characters'],
    },
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
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [120, 'Position must not exceed 120 characters'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    /** Self-referential reporting line - drives the organization chart. */
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
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
    workEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please provide a valid work email address',
      },
    },
    extension: {
      type: String,
      trim: true,
      maxlength: [20, 'Extension must not exceed 20 characters'],
      default: '',
    },
    officeLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Office location must not exceed 200 characters'],
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio must not exceed 2000 characters'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    /** Controls who can see contact details for this employee. */
    contactVisibility: {
      type: String,
      enum: VISIBILITY_LEVELS,
      default: 'staff_only',
    },
    /** Unpublished employees are hidden from the directory but visible to admins. */
    isPublished: {
      type: Boolean,
      default: true,
    },
    isActive: {
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

// Text index powers directory search across name, position and skills.
employeeSchema.index({
  firstName: 'text',
  lastName: 'text',
  nickname: 'text',
  position: 'text',
  skills: 'text',
});
employeeSchema.index({ departmentId: 1, isPublished: 1 });
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ lastName: 1, firstName: 1 });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/** Direct reports - used when building the org chart top-down. */
employeeSchema.virtual('directReports', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'managerId',
});

/**
 * Guard against an employee reporting to themselves. Deeper cycle detection
 * happens in the organization service where the whole tree is available.
 */
employeeSchema.pre('save', function (next) {
  if (this.managerId && this.managerId.equals(this._id)) {
    return next(new Error('An employee cannot be their own manager'));
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
