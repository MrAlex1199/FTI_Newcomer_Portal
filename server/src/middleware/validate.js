import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs after an express-validator chain. Collects field-level messages into
 * the same `errors` shape the global error handler already produces for
 * Mongoose validation errors, so the API response format stays consistent
 * regardless of which layer rejected the input.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const err of result.array()) {
    if (!details[err.path]) details[err.path] = err.msg;
  }

  next(ApiError.badRequest('Validation failed', details));
};

export default validate;
