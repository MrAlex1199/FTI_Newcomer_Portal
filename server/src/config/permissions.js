/**
 * Central authorization matrix (spec section 31).
 *
 * This is the single source of truth for "which roles may perform which
 * action". Route middleware references these sets rather than hardcoding role
 * lists inline, so the policy lives in one place and the frontend can mirror
 * the exact same matrix.
 *
 * An action maps to the set of roles allowed to perform it. `can(role, action)`
 * is the only read path - do not inspect the object directly elsewhere.
 */

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  STAFF: 'staff',
  INTERN: 'intern',
});

// Ordered high -> low privilege. Used only for display/sorting, never for
// implicit "higher role inherits lower permissions" logic - every action lists
// its allowed roles explicitly to avoid accidental privilege creep.
export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.EDITOR,
  ROLES.STAFF,
  ROLES.INTERN,
];

const ALL_ROLES = Object.values(ROLES);
const CONTENT_MANAGERS = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR];
const ADMINS = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/**
 * action -> array of roles permitted to perform it.
 *
 * "own profile" style permissions (an intern editing their own record) are NOT
 * expressed here because they depend on the target resource, not the role
 * alone. Those are enforced by the ownership guard middleware, which grants
 * access when the requester owns the resource OR holds one of the roles below.
 */
export const PERMISSIONS = Object.freeze({
  // Everyone authenticated
  'dashboard:view': ALL_ROLES,
  'employees:view': ALL_ROLES,
  'interns:view': ALL_ROLES,
  'organization:view': ALL_ROLES,
  'policies:view': ALL_ROLES,
  'faq:view': ALL_ROLES,
  'announcements:view': ALL_ROLES,

  // Content management
  'employees:manage': ADMINS,
  'interns:manage': ADMINS,
  'departments:manage': ADMINS,
  'policies:manage': CONTENT_MANAGERS,
  'faq:manage': CONTENT_MANAGERS,
  'announcements:manage': CONTENT_MANAGERS,
  'knowledge:manage': CONTENT_MANAGERS,

  // Feedback
  'feedback:submit': ALL_ROLES,
  'feedback:manage': CONTENT_MANAGERS,

  // Administration
  'users:manage': ADMINS,
  'auditlog:view': [ROLES.SUPER_ADMIN],
  'settings:manage': [ROLES.SUPER_ADMIN],
});

/** True if `role` is permitted to perform `action`. Unknown action -> false (deny by default). */
export const can = (role, action) => {
  const allowed = PERMISSIONS[action];
  return Array.isArray(allowed) && allowed.includes(role);
};

/** Roles allowed for an action - handy for wiring into authorize(...roles). */
export const rolesFor = (action) => PERMISSIONS[action] ?? [];

export { ALL_ROLES, CONTENT_MANAGERS, ADMINS };
