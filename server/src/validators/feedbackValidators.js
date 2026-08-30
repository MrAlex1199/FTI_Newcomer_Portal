import { body, param, query } from 'express-validator';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from '../models/Feedback.js';

export const submitFeedbackValidator = [
  body('category').isIn(FEEDBACK_CATEGORIES).withMessage('Invalid feedback category'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be between 5 and 2000 characters'),
  body('rating').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 5 }).toInt().withMessage('Rating must be between 1 and 5'),
];

export const listFeedbackValidator = [
  query('status').optional().isIn(FEEDBACK_STATUSES).withMessage('Invalid feedback status'),
  query('category').optional().isIn(FEEDBACK_CATEGORIES).withMessage('Invalid feedback category'),
  query('page').optional().isInt({ min: 1, max: 100000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const updateFeedbackValidator = [
  param('id').isMongoId().withMessage('Invalid feedback ID'),
  body('status').isIn(FEEDBACK_STATUSES).withMessage('Invalid feedback status'),
  body('adminNote').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Admin note must not exceed 2000 characters'),
];
