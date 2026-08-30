const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const HARD_MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Resolve configuration at request time so dotenv has already loaded. */
export const getMaxFileSize = () => {
  const configured = Number(process.env.MAX_FILE_SIZE);
  if (!Number.isFinite(configured) || configured < 1) return DEFAULT_MAX_FILE_SIZE;
  return Math.min(configured, HARD_MAX_FILE_SIZE);
};

export const MAX_FILE_SIZE = HARD_MAX_FILE_SIZE;
export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(',');
