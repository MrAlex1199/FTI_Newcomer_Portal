import { body, param, query } from 'express-validator';
import { ANNOUNCEMENT_CATEGORIES, CONTENT_STATUSES } from '../models/Announcement.js';
import { USER_ROLES } from '../models/User.js';

const derivedStatuses = [...CONTENT_STATUSES, 'scheduled', 'expired'];

const announcementFields = (optional) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('title').trim().notEmpty().withMessage('Title is required'))
      .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    body('summary').optional({ checkFalsy: true }).trim()
      .isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    opt(body('content').isString().notEmpty().withMessage('Content is required'))
      .isLength({ max: 20000 }).withMessage('Content must not exceed 20000 characters'),
    body('coverImage').optional({ checkFalsy: true })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Cover image URL must be a valid HTTP(S) URL'),
    body('category').optional().isIn(ANNOUNCEMENT_CATEGORIES).withMessage('Invalid announcement category'),
    body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be between 0 and 10').toInt(),
    body('targetRoles').optional().isArray().withMessage('Target roles must be an array'),
    body('targetRoles.*').optional().isIn(USER_ROLES).withMessage('Invalid target role'),
    body('publishAt').optional().isISO8601().withMessage('Publish date must be a valid date').toDate(),
    body('expireAt').optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage('Expiry date must be a valid date').toDate()
      .custom((value, { req }) => {
        if (!value || !req.body.publishAt) return true;
        return new Date(value) > new Date(req.body.publishAt);
      }).withMessage('Expiry date must be after the publish date'),
    body('isPinned').optional().isBoolean().withMessage('Pinned must be a boolean').toBoolean(),
    body('status').optional().isIn(CONTENT_STATUSES).withMessage('Invalid announcement status'),
  ];
};

export const createAnnouncementValidator = announcementFields(false);
export const updateAnnouncementValidator = [param('id').isMongoId().withMessage('id must be a valid id'), ...announcementFields(true)];
export const announcementIdValidator = [param('id').isMongoId().withMessage('id must be a valid id')];
export const listAnnouncementValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must not exceed 100 characters'),
  query('category').optional().isIn(ANNOUNCEMENT_CATEGORIES).withMessage('Invalid announcement category'),
  query('status').optional().isIn(derivedStatuses).withMessage('Invalid announcement status'),
  query('audience').optional().isIn(['live']).withMessage('Invalid announcement audience'),
];

export { derivedStatuses };
