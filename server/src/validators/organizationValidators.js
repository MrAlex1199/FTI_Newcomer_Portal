import { body, param, query } from 'express-validator';

const validObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

export const organizationTreeValidator = [
  query('department')
    .optional()
    .isMongoId()
    .withMessage('department must be a valid id'),
  query('departmentId')
    .optional()
    .isMongoId()
    .withMessage('departmentId must be a valid id'),
  query('maxDepth')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('maxDepth must be between 1 and 20'),
  query('depth')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('depth must be between 1 and 20'),
];

export const reportingUpdateValidator = [
  param('employeeId')
    .isMongoId()
    .withMessage('employeeId must be a valid id'),
  body('managerId')
    .custom((_value, { req }) => Object.prototype.hasOwnProperty.call(req.body, 'managerId'))
    .withMessage('managerId is required and may be null')
    .custom((value) => value === null || validObjectId(value))
    .withMessage('managerId must be a valid id or null'),
];
