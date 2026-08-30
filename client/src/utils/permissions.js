/**
 * Client mirror of the server authorization matrix
 * (server/src/config/permissions.js, spec section 31).
 *
 * This drives UI affordances ONLY - showing/hiding buttons and menu items,
 * gating routes for a nicer UX. It is NOT a security boundary. The server
 * enforces the identical matrix on every request; this copy just avoids
 * rendering actions the user would be refused anyway.
 *
 * Keep the two files in sync when permissions change.
 */

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  STAFF: 'staff',
  INTERN: 'intern',
});

const ALL_ROLES = Object.values(ROLES);
const CONTENT_MANAGERS = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR];
const ADMINS = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const PERMISSIONS = Object.freeze({
  'dashboard:view': ALL_ROLES,
  'employees:view': ALL_ROLES,
  'interns:view': ALL_ROLES,
  'organization:view': ALL_ROLES,
  'policies:view': ALL_ROLES,
  'faq:view': ALL_ROLES,
  'announcements:view': ALL_ROLES,
  'search:view': ALL_ROLES,

  'employees:manage': ADMINS,
  'interns:manage': ADMINS,
  'departments:manage': ADMINS,
  'policies:manage': CONTENT_MANAGERS,
  'faq:manage': CONTENT_MANAGERS,
  'announcements:manage': CONTENT_MANAGERS,
  'knowledge:manage': CONTENT_MANAGERS,

  'feedback:submit': ALL_ROLES,
  'feedback:manage': CONTENT_MANAGERS,

  'users:manage': ADMINS,
  'auditlog:view': [ROLES.SUPER_ADMIN],
  'settings:manage': [ROLES.SUPER_ADMIN],
});

/** True if `role` may perform `action`. Unknown action or role -> false. */
export const can = (role, action) => {
  const allowed = PERMISSIONS[action];
  return Array.isArray(allowed) && allowed.includes(role);
};

/** Human-friendly labels for display. */
export const ROLE_LABELS = Object.freeze({
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  staff: 'Staff',
  intern: 'Intern',
});
