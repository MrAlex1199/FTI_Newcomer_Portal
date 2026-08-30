import { body, param, query } from 'express-validator';
import { BATCH_STATUSES } from '../models/InternBatch.js';

const batchFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);

  return [
    opt(body('code').trim().notEmpty().withMessage('Batch code is required'))
      .isLength({ max: 20 })
      .withMessage('Batch code must not exceed 20 characters'),
    opt(body('title').trim().notEmpty().withMessage('Batch title is required'))
      .isLength({ max: 150 })
      .withMessage('Batch title must not exceed 150 characters'),
    opt(body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')),
    opt(body('sequence').isInt({ min: 1 }).withMessage('Sequence must be at least 1')),
    opt(body('startDate').isISO8601().withMessage('Start date must be a valid date').toDate()),
    opt(body('endDate').isISO8601().withMessage('End date must be a valid date').toDate()),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  ];
};

export const createInternBatchValidator = batchFields(false);
export const updateInternBatchValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...batchFields(true)];
export const internBatchIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listInternBatchesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('status').optional().isIn(BATCH_STATUSES).withMessage('status must be upcoming, active, or completed'),
];
