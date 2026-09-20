import mongoose from 'mongoose';

const knowledgeTopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
      maxlength: [100, 'Topic name must not exceed 100 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      trim: true,
      default: '📁',
      maxlength: [30, 'Icon identifier must not exceed 30 characters'],
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeTopic',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['it_help', 'getting_started', 'company_info', 'general'],
      default: 'it_help',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description must not exceed 300 characters'],
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

knowledgeTopicSchema.index({ category: 1, parentId: 1, sortOrder: 1 });

const KnowledgeTopic = mongoose.model('KnowledgeTopic', knowledgeTopicSchema);

export default KnowledgeTopic;
