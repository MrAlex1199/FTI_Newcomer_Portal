import { body, param } from 'express-validator';

const departmentFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);

  return [
    opt(body('name').trim().notEmpty().withMessage('Department name is required'))
      .isLength({ max: 120 })
      .withMessage('Department name must not exceed 120 characters'),
    opt(body('code').trim().notEmpty().withMessage('Department code is required'))
      .isLength({ max: 12 })
      .withMessage('Department code must not exceed 12 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Department code may contain only letters, numbers, hyphens, and underscores'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('responsibilities').optional().isArray({ max: 30 }).withMessage('Responsibilities must be an array with at most 30 items'),
    body('responsibilities.*').optional().isString().trim().isLength({ max: 200 }).withMessage('Each responsibility must not exceed 200 characters'),
    body('contactTopics').optional().isArray({ max: 30 }).withMessage('Contact topics must be an array with at most 30 items'),
    body('contactTopics.*').optional().isString().trim().isLength({ max: 200 }).withMessage('Each contact topic must not exceed 200 characters'),
    body('managerId')
      .optional({ nullable: true })
      .custom((value) => value === null || /^[0-9a-fA-F]{24}$/.test(value))
      .withMessage('managerId must be a valid id or null'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('extension').optional().trim().isLength({ max: 20 }).withMessage('Extension must not exceed 20 characters'),
    body('sortOrder').optional().isInt({ min: 0, max: 100000 }).withMessage('sortOrder must be a non-negative integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ];
};

export const createDepartmentValidator = departmentFields(false);
export const updateDepartmentValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...departmentFields(true)];
export const departmentIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
