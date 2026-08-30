/**
 * Central export point for every Mongoose model.
 * Importing from here guarantees all schemas are registered before use,
 * which matters for `populate()` on refs declared by name.
 */
export { default as User, USER_ROLES } from './User.js';
export { default as Department } from './Department.js';
export { default as Employee, VISIBILITY_LEVELS } from './Employee.js';
export { default as InternBatch, BATCH_STATUSES } from './InternBatch.js';
export { default as Intern, INTERN_STATUSES } from './Intern.js';
export {
  default as Announcement,
  ANNOUNCEMENT_CATEGORIES,
  CONTENT_STATUSES,
} from './Announcement.js';
export { default as Policy, POLICY_CATEGORIES } from './Policy.js';
export { default as FAQ, FAQ_CATEGORIES } from './FAQ.js';
export {
  default as KnowledgeArticle,
  ARTICLE_CATEGORIES,
  GETTING_STARTED_SECTIONS,
  IT_HELP_TOPICS,
} from './KnowledgeArticle.js';
export { default as Feedback, FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from './Feedback.js';
export { default as AuditLog, AUDIT_ACTIONS } from './AuditLog.js';
