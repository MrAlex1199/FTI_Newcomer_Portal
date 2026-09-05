import { body, param, query } from 'express-validator';

export const createCommentValidator = [
  param('articleId').isMongoId().withMessage('articleId must be a valid id'),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment body must be between 1 and 2000 characters'),
];

export const deleteCommentValidator = [
  param('articleId').isMongoId().withMessage('articleId must be a valid id'),
  param('commentId').isMongoId().withMessage('commentId must be a valid id'),
];

export const listCommentValidator = [
  param('articleId').isMongoId().withMessage('articleId must be a valid id'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

export const addImageValidator = [
  param('id').isMongoId().withMessage('id must be a valid id'),
  body('caption').optional().trim().isLength({ max: 200 }).withMessage('Caption must not exceed 200 characters'),
];

export const removeImageValidator = [
  param('id').isMongoId().withMessage('id must be a valid id'),
  param('imgId').isMongoId().withMessage('imgId must be a valid id'),
];

export const reorderImagesValidator = [
  param('id').isMongoId().withMessage('id must be a valid id'),
  body('imageIds').isArray().withMessage('imageIds must be an array'),
  body('imageIds.*').isMongoId().withMessage('Each imageId must be a valid id'),
];
