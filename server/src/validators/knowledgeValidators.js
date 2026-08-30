import { body, param, query } from 'express-validator';
import { ARTICLE_CATEGORIES, GETTING_STARTED_SECTIONS, IT_HELP_TOPICS } from '../models/KnowledgeArticle.js';
import { CONTENT_STATUSES } from '../models/Announcement.js';
import { USER_ROLES } from '../models/User.js';

const articleFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('title').trim().notEmpty().withMessage('Title is required')).isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    opt(body('slug').trim().notEmpty().withMessage('Slug is required')).matches(/^[a-z0-9-]+$/).withMessage('Slug may only contain lowercase letters, numbers and hyphens'),
    opt(body('category').isIn(ARTICLE_CATEGORIES).withMessage('Invalid article category')),
    body('subcategory').optional().trim().isLength({ max: 80 }).withMessage('Subcategory must not exceed 80 characters').custom((value, { req }) => {
      if (req.body.category === 'it_help') return IT_HELP_TOPICS.includes(value);
      if (req.body.category === 'getting_started') return GETTING_STARTED_SECTIONS.includes(value);
      return true;
    }).withMessage('Invalid subcategory for the selected article category'),
    body('summary').optional().trim().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    opt(body('content').isString().notEmpty().withMessage('Content is required')).isLength({ max: 20000 }).withMessage('Content must not exceed 20000 characters'),
    body('coverImage').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Cover image must be a valid HTTP(S) URL'),
    body('tags').optional().isArray({ max: 20 }).withMessage('Tags must be an array with at most 20 items'),
    body('tags.*').optional().isString().trim().isLength({ max: 50 }).withMessage('Each tag must not exceed 50 characters'),
    body('targetRoles').optional().isArray().withMessage('Target roles must be an array'),
    body('targetRoles.*').optional().isIn(USER_ROLES).withMessage('Invalid target role'),
    body('sortOrder').optional().isInt({ min: 0, max: 100000 }).withMessage('sortOrder must be a non-negative integer'),
    body('isQuickLink').optional().isBoolean().withMessage('isQuickLink must be a boolean'),
    body('quickLinkOrder').optional().isInt({ min: 0, max: 100000 }).withMessage('quickLinkOrder must be a non-negative integer'),
    body('status').optional().isIn(CONTENT_STATUSES).withMessage('Invalid article status'),
  ];
};

export const createArticleValidator = articleFields(false);
export const updateArticleValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...articleFields(true)];
export const articleIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listArticleValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must not exceed 100 characters'),
  query('category').optional().isIn(ARTICLE_CATEGORIES).withMessage('Invalid article category'),
  query('subcategory').optional().custom((value) => [...GETTING_STARTED_SECTIONS, ...IT_HELP_TOPICS].includes(value) || typeof value === 'string').withMessage('Invalid subcategory'),
  query('status').optional().isIn(CONTENT_STATUSES).withMessage('Invalid article status'),
  query('quickLinks').optional().isBoolean().withMessage('quickLinks must be a boolean'),
];
