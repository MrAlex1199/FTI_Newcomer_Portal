import mongoose from 'mongoose';

const vaultSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    pinHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    pinHint: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    autoLockMinutes: {
      type: Number,
      default: 10,
      min: 1,
      max: 60,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const VaultSettings = mongoose.model('VaultSettings', vaultSettingsSchema);
export default VaultSettings;
