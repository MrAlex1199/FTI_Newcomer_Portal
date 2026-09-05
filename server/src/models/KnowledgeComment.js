import mongoose from 'mongoose';

const knowledgeCommentSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeArticle',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      minlength: [1, 'Comment body cannot be empty'],
      maxlength: [2000, 'Comment body must not exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

knowledgeCommentSchema.index({ articleId: 1, createdAt: 1 });

const KnowledgeComment = mongoose.model('KnowledgeComment', knowledgeCommentSchema);

export default KnowledgeComment;
