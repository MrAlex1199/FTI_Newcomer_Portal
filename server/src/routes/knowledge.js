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
  createArticleValidator,
  updateArticleValidator,
  articleIdValidator,
  listArticleValidator,
} from '../validators/knowledgeValidators.js';
import { knowledgeVoteValidator } from '../validators/knowledgeVoteValidators.js';
import validate from '../middleware/validate.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/categories', requirePermission('policies:view'), listArticleCategories);
router.get('/it-help/quick-links', requirePermission('policies:view'), listArticleValidator, validate, listQuickLinks);
router.get('/', requirePermission('policies:view'), listArticleValidator, validate, listArticles);
router.get('/:id', requirePermission('policies:view'), articleIdValidator, validate, getArticle);
router.post('/', requirePermission('knowledge:manage'), createArticleValidator, validate, createArticle);
router.patch('/:id', requirePermission('knowledge:manage'), updateArticleValidator, validate, updateArticle);
router.delete('/:id', requirePermission('knowledge:manage'), articleIdValidator, validate, deleteArticle);
router.post('/:id/helpfulness', requirePermission('policies:view'), knowledgeVoteValidator, validate, voteArticle);

export default router;
