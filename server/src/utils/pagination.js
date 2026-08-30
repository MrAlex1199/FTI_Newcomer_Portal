/**
 * Shared pagination + sorting helpers, so every list endpoint parses query
 * params and shapes its response the same way (spec section 30).
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse `page`, `limit`, and `sort` from a query string into safe values.
 *
 * - page/limit are clamped to sane bounds so a caller can't request page 0,
 *   a negative offset, or a 10,000-row dump.
 * - sort accepts a comma list with optional leading '-' for descending,
 *   e.g. "-createdAt,lastName". Only fields in `allowedSortFields` are honored
 *   to prevent sorting on unindexed or sensitive fields; anything else falls
 *   back to `defaultSort`.
 */
export const parsePagination = (query = {}, { allowedSortFields = [], defaultSort = { createdAt: -1 } } = {}) => {
  let page = parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;

  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  let sort = defaultSort;
  if (typeof query.sort === 'string' && query.sort.trim()) {
    const parsed = {};
    for (const token of query.sort.split(',')) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      const desc = trimmed.startsWith('-');
      const field = desc ? trimmed.slice(1) : trimmed;
      if (allowedSortFields.includes(field)) {
        parsed[field] = desc ? -1 : 1;
      }
    }
    if (Object.keys(parsed).length > 0) sort = parsed;
  }

  return { page, limit, skip, sort };
};

/**
 * Build the standard success envelope for a paginated list.
 * Mirrors the response shape in spec section 30.
 */
export const paginatedResponse = ({ data, page, limit, total }) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  },
});

export { DEFAULT_LIMIT, MAX_LIMIT };
