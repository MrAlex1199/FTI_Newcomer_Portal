import { body } from 'express-validator';

const optionalText = (field, max, label) => body(field)
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max })
  .withMessage(`${label} must not exceed ${max} characters`);

export const updateProfileValidator = [
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  optionalText('firstName', 80, 'First name'),
  optionalText('lastName', 80, 'Last name'),
  optionalText('nickname', 50, 'Nickname'),
];
