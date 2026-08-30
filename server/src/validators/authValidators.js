import { body } from 'express-validator';

/**
 * Public self-registration only ever creates a 'staff' account - there is no
 * `role` field here on purpose. Elevated roles (admin, editor, intern-with-
 * batch-link, etc.) are assigned later by an admin through user management,
 * never chosen by the registrant themselves.
 */
export const registerValidator = [
  body('username')
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9._-]+$/)
    .withMessage('Username may only contain letters, numbers, dots, hyphens and underscores'),
  body('email').trim().toLowerCase().isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const loginValidator = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
