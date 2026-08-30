import { body, param, query } from 'express-validator';
import { VISIBILITY_LEVELS } from '../models/Employee.js';

const objectId = (field, location = body) =>
  location(field)
    .isMongoId()
    .withMessage(`${field} must be a valid id`);

/**
 * Full set of writable employee fields. `create` marks the required ones;
 * `update` reuses the same rules but makes everything optional so a PATCH can
 * send just the changed fields.
 */
const employeeFieldRules = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('employeeCode').trim().notEmpty().withMessage('Employee code is required'))
      .isLength({ max: 20 })
      .withMessage('Employee code must not exceed 20 characters'),
    opt(body('firstName').trim().notEmpty().withMessage('First name is required'))
      .isLength({ max: 80 })
      .withMessage('First name must not exceed 80 characters'),
    opt(body('lastName').trim().notEmpty().withMessage('Last name is required'))
      .isLength({ max: 80 })
      .withMessage('Last name must not exceed 80 characters'),
    opt(body('position').trim().notEmpty().withMessage('Position is required'))
      .isLength({ max: 120 })
      .withMessage('Position must not exceed 120 characters'),
    opt(body('departmentId').notEmpty().withMessage('Department is required'))
      .isMongoId()
      .withMessage('departmentId must be a valid id'),

    // Always-optional fields.
    body('nickname').optional().trim().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
    body('managerId')
      .optional({ nullable: true })
      .custom((v) => v === null || /^[0-9a-fA-F]{24}$/.test(v))
      .withMessage('managerId must be a valid id or null'),
    body('workEmail').optional({ checkFalsy: true }).trim().isEmail().withMessage('Work email must be valid'),
    body('extension').optional().trim().isLength({ max: 20 }).withMessage('Extension must not exceed 20 characters'),
    body('officeLocation').optional().trim().isLength({ max: 200 }),
    body('bio').optional().trim().isLength({ max: 2000 }).withMessage('Bio must not exceed 2000 characters'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').optional().isString().trim(),
    body('contactVisibility')
      .optional()
      .isIn(VISIBILITY_LEVELS)
      .withMessage('Invalid contact visibility level'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ];
};

export const createEmployeeValidator = employeeFieldRules(false);
export const updateEmployeeValidator = [objectId('id', param), ...employeeFieldRules(true)];
export const employeeIdValidator = [objectId('id', param)];

export const listEmployeesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('department').optional().isMongoId().withMessage('department must be a valid id'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('status must be active or inactive'),
  query('published').optional().isBoolean().withMessage('published must be a boolean'),
];
