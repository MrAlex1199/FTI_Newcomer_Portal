import { body, param, query } from 'express-validator';
import { POLICY_CATEGORIES } from '../models/Policy.js';
import { CONTENT_STATUSES } from '../models/Announcement.js';

const policyFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('title').trim().notEmpty().withMessage('Title is required')).isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    body('summary').optional().trim().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    opt(body('content').isString().notEmpty().withMessage('Content is required')).isLength({ max: 20000 }).withMessage('Content must not exceed 20000 characters'),
    body('category').optional().isIn(POLICY_CATEGORIES).withMessage('Invalid policy category'),
    body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be between 0 and 10'),
    body('version').optional().trim().isLength({ max: 30 }).withMessage('Version must not exceed 30 characters'),
    body('effectiveDate').optional().isISO8601().withMessage('Effective date must be a valid date').toDate(),
    body('attachmentUrl').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Attachment URL must be a valid HTTP(S) URL'),
    body('status').optional().isIn(CONTENT_STATUSES).withMessage('Invalid policy status'),
  ];
};

export const createPolicyValidator = policyFields(false);
export const updatePolicyValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...policyFields(true)];
export const policyIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listPolicyValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must not exceed 100 characters'),
  query('category').optional().isIn(POLICY_CATEGORIES).withMessage('Invalid policy category'),
  query('status').optional().isIn(CONTENT_STATUSES).withMessage('Invalid policy status'),
  query('published').optional().isBoolean().withMessage('published must be a boolean'),
];
