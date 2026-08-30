import { body, param, query } from 'express-validator';
import { INTERN_STATUSES } from '../models/Intern.js';

const objectIdOrNull = (field) =>
  body(field)
    .optional({ nullable: true })
    .custom((value) => value === null || /^[0-9a-fA-F]{24}$/.test(value))
    .withMessage(`${field} must be a valid id or null`);

const internFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);

  return [
    opt(body('firstName').trim().notEmpty().withMessage('First name is required'))
      .isLength({ max: 80 }).withMessage('First name must not exceed 80 characters'),
    opt(body('lastName').trim().notEmpty().withMessage('Last name is required'))
      .isLength({ max: 80 }).withMessage('Last name must not exceed 80 characters'),
    body('nickname').optional().trim().isLength({ max: 50 }).withMessage('Nickname must not exceed 50 characters'),
    opt(body('university').trim().notEmpty().withMessage('University is required'))
      .isLength({ max: 200 }).withMessage('University must not exceed 200 characters'),
    body('faculty').optional().trim().isLength({ max: 200 }).withMessage('Faculty must not exceed 200 characters'),
    body('major').optional().trim().isLength({ max: 200 }).withMessage('Major must not exceed 200 characters'),
    body('year').optional({ nullable: true }).isInt({ min: 1, max: 8 }).withMessage('Year must be between 1 and 8'),
    body('age').optional({ nullable: true }).isInt({ min: 15, max: 80 }).withMessage('Age must be between 15 and 80'),
    opt(body('departmentId').notEmpty().withMessage('Department is required'))
      .isMongoId().withMessage('departmentId must be a valid id'),
    objectIdOrNull('mentorId'),
    opt(body('batchId').notEmpty().withMessage('Batch is required'))
      .isMongoId().withMessage('batchId must be a valid id'),
    opt(body('startDate').isISO8601().withMessage('Start date must be a valid date').toDate()),
    opt(body('endDate').isISO8601().withMessage('End date must be a valid date').toDate()),
    body('shortBio').optional().trim().isLength({ max: 1000 }).withMessage('Short bio must not exceed 1000 characters'),
    body('projectTitle').optional().trim().isLength({ max: 250 }).withMessage('Project title must not exceed 250 characters'),
    body('lessonsLearned').optional().trim().isLength({ max: 3000 }).withMessage('Lessons learned must not exceed 3000 characters'),
    body('adviceForNextBatch').optional().trim().isLength({ max: 3000 }).withMessage('Advice must not exceed 3000 characters'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    body('privacyConsent').optional().isBoolean().withMessage('privacyConsent must be a boolean'),
  ];
};

export const createInternValidator = internFields(false);
export const updateInternValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...internFields(true)];
export const internIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listInternsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('department').optional().isMongoId().withMessage('department must be a valid id'),
  query('batch').optional().isMongoId().withMessage('batch must be a valid id'),
  query('status').optional().isIn(INTERN_STATUSES).withMessage('status must be upcoming, active, or completed'),
  query('published').optional().isBoolean().withMessage('published must be a boolean'),
];
