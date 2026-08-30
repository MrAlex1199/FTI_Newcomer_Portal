import { query } from 'express-validator';

export const SEARCH_TYPES = ['employee', 'intern', 'department', 'faq', 'policy', 'announcement', 'knowledge', 'company'];

export const searchValidator = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Search query must not exceed 100 characters'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Search limit must be between 1 and 20'),
  query('types').optional().custom((value) => {
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.every((type) => SEARCH_TYPES.includes(type));
  }).withMessage('Invalid search entity type'),
];
