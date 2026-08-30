import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'publish',
  'unpublish',
  'activate',
  'deactivate',
  'role_change',
  'password_reset',
  'bulk_deactivate',
];

/**
 * Append-only record of sensitive admin activity (spec section 39).
 * Secrets and password fields must never be written here - the audit service
 * strips them before calling `AuditLog.record()`.
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: [true, 'Action is required'],
    },
    /** Model name the action applied to, e.g. "Employee". */
    entity: {
      type: String,
      required: [true, 'Entity is required'],
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    // Audit entries are never edited, so only a creation timestamp is kept.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

/** Fields that must never be persisted into an audit snapshot. */
const REDACTED_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'jwtSecret',
  'apiKey',
  'apiSecret',
];

const redact = (payload) => {
  if (!payload || typeof payload !== 'object') return payload ?? null;
  const plain = typeof payload.toObject === 'function' ? payload.toObject() : { ...payload };
  for (const field of REDACTED_FIELDS) {
    if (field in plain) delete plain[field];
  }
  return plain;
};

/** Write an audit entry with sensitive fields stripped from both snapshots. */
auditLogSchema.statics.record = function ({
  userId = null,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  ip = '',
  userAgent = '',
}) {
  return this.create({
    userId,
    action,
    entity,
    entityId,
    before: redact(before),
    after: redact(after),
    ip,
    userAgent,
  });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
export { REDACTED_FIELDS };
