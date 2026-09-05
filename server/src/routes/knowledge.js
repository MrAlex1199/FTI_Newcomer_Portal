import { Router } from 'express';
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  listArticleCategories,
  listQuickLinks,
  voteArticle,
} from '../controllers/knowledgeController.js';
import {
  addArticleImage,
  removeArticleImage,
  reorderArticleImages,
} from '../controllers/knowledgeImageController.js';
import {
  listComments,
  createComment,
  deleteComment,
} from '../controllers/knowledgeCommentController.js';
import {
  createArticleValidator,
  updateArticleValidator,
  articleIdValidator,
  listArticleValidator,
} from '../validators/knowledgeValidators.js';
import { knowledgeVoteValidator } from '../validators/knowledgeVoteValidators.js';
import {
  createCommentValidator,
  deleteCommentValidator,
  listCommentValidator,
  addImageValidator,
  removeImageValidator,
  reorderImagesValidator,
} from '../validators/knowledgeCommentValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';

const router = Router();
router.use(authenticate);

// Categories & Quick links
router.get('/categories', requirePermission('policies:view'), listArticleCategories);
router.get('/it-help/quick-links', requirePermission('policies:view'), listArticleValidator, validate, listQuickLinks);

// Comments
router.get('/:articleId/comments', requirePermission('policies:view'), listCommentValidator, validate, listComments);
router.post('/:articleId/comments', requirePermission('policies:view'), createCommentValidator, validate, createComment);
router.delete('/:articleId/comments/:commentId', requirePermission('policies:view'), deleteCommentValidator, validate, deleteComment);

// Image management for articles
router.post('/:id/images', requirePermission('knowledge:manage'), imageUpload('image'), addImageValidator, validate, addArticleImage);
router.delete('/:id/images/:imgId', requirePermission('knowledge:manage'), removeImageValidator, validate, removeArticleImage);
router.patch('/:id/images/reorder', requirePermission('knowledge:manage'), reorderImagesValidator, validate, reorderArticleImages);

// Articles CRUD
router.get('/', requirePermission('policies:view'), listArticleValidator, validate, listArticles);
router.get('/:id', requirePermission('policies:view'), articleIdValidator, validate, getArticle);
router.post('/', requirePermission('knowledge:manage'), imageUpload('coverImage'), createArticleValidator, validate, createArticle);
router.patch('/:id', requirePermission('knowledge:manage'), imageUpload('coverImage'), updateArticleValidator, validate, updateArticle);
router.delete('/:id', requirePermission('knowledge:manage'), articleIdValidator, validate, deleteArticle);
router.post('/:id/helpfulness', requirePermission('policies:view'), knowledgeVoteValidator, validate, voteArticle);

export default router;
