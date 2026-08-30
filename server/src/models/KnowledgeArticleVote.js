import mongoose from 'mongoose';

const knowledgeArticleVoteSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeArticle',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vote: {
      type: String,
      enum: ['helpful', 'not_helpful'],
      required: true,
    },
  },
  { timestamps: true }
);

knowledgeArticleVoteSchema.index({ articleId: 1, userId: 1 }, { unique: true });
knowledgeArticleVoteSchema.index({ userId: 1, updatedAt: -1 });

const KnowledgeArticleVote = mongoose.model('KnowledgeArticleVote', knowledgeArticleVoteSchema);

export default KnowledgeArticleVote;
