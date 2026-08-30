import { body, param, query } from 'express-validator';
import { FAQ_CATEGORIES } from '../models/FAQ.js';

const faqFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('question').trim().notEmpty().withMessage('Question is required')).isLength({ max: 300 }).withMessage('Question must not exceed 300 characters'),
    opt(body('answer').isString().notEmpty().withMessage('Answer is required')).isLength({ max: 5000 }).withMessage('Answer must not exceed 5000 characters'),
    body('category').optional().isIn(FAQ_CATEGORIES).withMessage('Invalid FAQ category'),
    body('tags').optional().isArray({ max: 20 }).withMessage('Tags must be an array with at most 20 items'),
    body('tags.*').optional().isString().trim().isLength({ max: 50 }).withMessage('Each tag must not exceed 50 characters'),
    body('sortOrder').optional().isInt({ min: 0, max: 100000 }).withMessage('sortOrder must be a non-negative integer'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  ];
};

export const createFaqValidator = faqFields(false);
export const updateFaqValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...faqFields(true)];
export const faqIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listFaqValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must not exceed 100 characters'),
  query('category').optional().isIn(FAQ_CATEGORIES).withMessage('Invalid FAQ category'),
  query('published').optional().isBoolean().withMessage('published must be a boolean'),
];

export const reorderFaqValidator = [
  body('category').isIn(FAQ_CATEGORIES).withMessage('Invalid FAQ category'),
  body('items')
    .isArray({ min: 1, max: 100 })
    .withMessage('items must contain between 1 and 100 FAQ entries')
    .custom((items) => items.every((item) => item && typeof item.id === 'string' && /^[0-9a-fA-F]{24}$/.test(item.id)))
    .withMessage('Each reorder item must contain a valid FAQ id'),
];
