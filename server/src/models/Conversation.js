import mongoose from 'mongoose';

export const CONVERSATION_TYPES = ['direct', 'support', 'channel'];

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CONVERSATION_TYPES,
      default: 'direct',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    title: {
      type: String,
      trim: true,
      default: '',
    },
    supportDepartment: {
      type: String,
      enum: ['it', 'hr', null],
      default: null,
    },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ type: 1, supportDepartment: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
