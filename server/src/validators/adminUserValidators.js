import { body, param, query } from 'express-validator';
import { USER_ROLES } from '../models/User.js';
import { AUDIT_ACTIONS } from '../models/AuditLog.js';

const optionalNullableId = (field) => field
  .optional({ nullable: true })
  .custom((value) => value === null || /^[a-f\d]{24}$/i.test(value))
  .withMessage('Must be a valid ID or null');

export const listUsersValidator = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search is too long'),
  query('role').optional({ checkFalsy: true }).isIn(USER_ROLES).withMessage('Invalid role'),
  query('active').optional().isBoolean().toBoolean().withMessage('Active must be true or false'),
  query('page').optional().isInt({ min: 1, max: 100000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createUserValidator = [
  body('username')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Username is required')
    .bail()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .bail()
    .matches(/^[a-z0-9._-]+$/).withMessage('Username may only contain letters, numbers, dots, hyphens and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .bail()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email address'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters').matches(/[A-Za-z]/).withMessage('Password must contain a letter').matches(/\d/).withMessage('Password must contain a number'),
  body('role').optional().isIn(USER_ROLES).withMessage('Invalid role'),
  optionalNullableId(body('employeeId')),
  optionalNullableId(body('internId')),
];

export const updateUserValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('username').optional().trim().toLowerCase().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9._-]+$/).withMessage('Invalid username'),
  body('email').optional().trim().normalizeEmail().isEmail().withMessage('Please provide a valid email address'),
  body('role').optional().isIn(USER_ROLES).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().toBoolean().withMessage('isActive must be true or false'),
  optionalNullableId(body('employeeId')),
  optionalNullableId(body('internId')),
];

export const userIdValidator = [param('id').isMongoId().withMessage('Invalid user ID')];

export const resetPasswordValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters').matches(/[A-Za-z]/).withMessage('Password must contain a letter').matches(/\d/).withMessage('Password must contain a number'),
];

export const bulkDeactivateValidator = [
  body('userIds').isArray({ min: 1, max: 100 }).withMessage('userIds must contain between 1 and 100 IDs'),
  body('userIds.*').isMongoId().withMessage('Each user ID must be valid'),
];

export const auditLogsValidator = [
  query('action').optional().isIn(AUDIT_ACTIONS).withMessage('Invalid audit action'),
  query('entity').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Invalid entity'),
  query('actor').optional().isMongoId().withMessage('Invalid actor ID'),
  query('entityId').optional().isMongoId().withMessage('Invalid entity ID'),
  query('from').optional().isISO8601().toDate().withMessage('Invalid start date'),
  query('to').optional().isISO8601().toDate().withMessage('Invalid end date'),
  query('page').optional().isInt({ min: 1, max: 100000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
