import mongoose from 'mongoose';

export const VAULT_CATEGORIES = ['login', 'note', 'card', 'key'];

const vaultItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: VAULT_CATEGORIES,
      default: 'login',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    favorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // Visible metadata for quick list filtering & display
    username: {
      type: String,
      default: '',
      trim: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    // AES-256-GCM authenticated encrypted payload
    encryptedData: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query performance
vaultItemSchema.index({ userId: 1, category: 1, favorite: 1 });
vaultItemSchema.index({ userId: 1, title: 'text', username: 'text', tags: 'text' });

const VaultItem = mongoose.model('VaultItem', vaultItemSchema);
export default VaultItem;
