import { body } from 'express-validator';

const officePoint = (value) => value && typeof value === 'object' && typeof value.name === 'string' && value.name.trim().length > 0 && Number.isFinite(Number(value.latitude)) && Number.isFinite(Number(value.longitude));

export const updateCompanyValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),
  body('tagline').optional().trim().isLength({ max: 300 }).withMessage('Tagline must not exceed 300 characters'),
  body('overview').optional().trim().isLength({ max: 5000 }).withMessage('Overview must not exceed 5000 characters'),
  body('mission').optional().trim().isLength({ max: 3000 }).withMessage('Mission must not exceed 3000 characters'),
  body('vision').optional().trim().isLength({ max: 3000 }).withMessage('Vision must not exceed 3000 characters'),
  body('history').optional().trim().isLength({ max: 5000 }).withMessage('History must not exceed 5000 characters'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must not exceed 50 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('website').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Website must be a valid HTTP(S) URL'),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('mapProvider').optional().isIn(['openstreetmap']).withMessage('Unsupported map provider'),
  body('officePoints').optional().isArray({ max: 50 }).withMessage('Office points must contain at most 50 entries'),
  body('officePoints.*').optional().custom(officePoint).withMessage('Each office point needs a name and valid coordinates'),
];
