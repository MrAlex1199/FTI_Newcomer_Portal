import { query } from 'express-validator';

export const adminDashboardValidator = [
  query('activityLimit').optional().isInt({ min: 1, max: 20 }).withMessage('activityLimit must be between 1 and 20'),
];
