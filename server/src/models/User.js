import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export const USER_ROLES = ['super_admin', 'admin', 'editor', 'staff', 'intern'];

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match: [/^[a-z0-9._-]+$/, 'Username may only contain letters, numbers, dots, hyphens and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    // Stores the bcrypt hash. Never stores plaintext - see pre-save hook below.
    // `select: false` keeps it out of every query result unless explicitly requested.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid role',
      },
      default: 'staff',
      required: true,
    },
    // A user account may be linked to either an employee or an intern record (or neither).
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      default: null,
    },
    // Fallback profile fields for accounts that are not linked to a directory record.
    firstName: {
      type: String,
      trim: true,
      maxlength: [80, 'First name must not exceed 80 characters'],
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [80, 'Last name must not exceed 80 characters'],
      default: '',
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, 'Nickname must not exceed 50 characters'],
      default: '',
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
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Account lockout tracking (spec section 3.1)
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    // Bumped on logout and on password change so previously issued refresh
    // tokens are rejected immediately instead of remaining valid until expiry.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ role: 1, isActive: 1 });

/** True while the account is temporarily locked after repeated failed logins. */
userSchema.virtual('isLocked').get(function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Hash the password whenever it is set or changed. Plaintext never reaches the database.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a plaintext candidate against the stored hash.
 * Requires the document to have been loaded with `.select('+password')`.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password field not selected on this document. Use .select("+password")');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/** Increment the failed-login counter and lock the account once the threshold is hit. */
userSchema.methods.registerFailedLogin = async function () {
  // A previous lock has expired - start counting again from scratch.
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
  }
  return this.save({ validateBeforeSave: false });
};

/** Clear lockout state and stamp the successful login. */
userSchema.methods.registerSuccessfulLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  return this.save({ validateBeforeSave: false });
};

/**
 * Invalidate every refresh token issued so far. Called on logout and on
 * password change so a stolen refresh token stops working immediately.
 */
userSchema.methods.invalidateTokens = async function () {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

export default User;
export { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS };
