import { KnowledgeArticle, KnowledgeComment } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const canManage = (req) => can(req.user.role, 'knowledge:manage');

export const listComments = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const article = await KnowledgeArticle.findById(articleId);
  if (!article) throw ApiError.notFound('Knowledge article not found');

  const { page, limit, skip } = parsePagination(req.query, {
    allowedSortFields: ['createdAt'],
    defaultSort: { createdAt: 1 },
  });

  const [comments, total] = await Promise.all([
    KnowledgeComment.find({ articleId })
      .populate('authorId', 'username role')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    KnowledgeComment.countDocuments({ articleId }),
  ]);

  res.status(200).json(
    paginatedResponse({
      data: comments,
      page,
      limit,
      total,
    })
  );
});

export const createComment = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const article = await KnowledgeArticle.findById(articleId);
  if (!article) throw ApiError.notFound('Knowledge article not found');

  const { body } = req.body;
  if (!body || !body.trim()) {
    throw ApiError.badRequest('Comment body cannot be empty');
  }

  const comment = await KnowledgeComment.create({
    articleId,
    authorId: req.user.id,
    body: body.trim(),
  });

  await KnowledgeArticle.updateOne({ _id: articleId }, { $inc: { commentCount: 1 } });
  await comment.populate('authorId', 'username role');

  res.status(201).json({
    success: true,
    data: { comment },
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { articleId, commentId } = req.params;

  const comment = await KnowledgeComment.findOne({ _id: commentId, articleId });
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAuthor = comment.authorId.toString() === req.user.id;
  const isManager = canManage(req);

  if (!isAuthor && !isManager) {
    throw ApiError.forbidden('You do not have permission to delete this comment');
  }

  await comment.deleteOne();

  await KnowledgeArticle.updateOne(
    { _id: articleId, commentCount: { $gt: 0 } },
    { $inc: { commentCount: -1 } }
  );

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});
