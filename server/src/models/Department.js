import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [120, 'Department name must not exceed 120 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [12, 'Department code must not exceed 12 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must not exceed 1000 characters'],
      default: '',
    },
    /** What this department handles - shown on the "who should I contact" page. */
    responsibilities: {
      type: [String],
      default: [],
    },
    /** Topics people should contact this department about. */
    contactTopics: {
      type: [String],
      default: [],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location must not exceed 200 characters'],
      default: '',
    },
    extension: {
      type: String,
      trim: true,
      maxlength: [20, 'Extension must not exceed 20 characters'],
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
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

departmentSchema.index({ name: 'text', description: 'text' });
departmentSchema.index({ isActive: 1, sortOrder: 1 });

/** Employees belonging to this department (populate on demand). */
departmentSchema.virtual('employees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'departmentId',
});

/** Interns assigned to this department (populate on demand). */
departmentSchema.virtual('interns', {
  ref: 'Intern',
  localField: '_id',
  foreignField: 'departmentId',
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;
