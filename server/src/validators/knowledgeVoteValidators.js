import { body, param } from 'express-validator';

export const knowledgeVoteValidator = [
  param('id').isMongoId().withMessage('id must be a valid id'),
  body('vote').isIn(['helpful', 'not_helpful']).withMessage('Vote must be helpful or not_helpful'),
];
