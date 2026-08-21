/** Metadata keys read by the global guards. */
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Pagination defaults for every list endpoint (§6.2). */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 100;

/** Home-page carousel size for `GET /courses/featured`. */
export const FEATURED_COURSES_LIMIT = 6;

/** Name of the refresh-token cookie set by the auth controller. */
export const REFRESH_TOKEN_COOKIE = 'mars_refresh_token';

/** Hidden field public forms must leave empty — a filled one means a bot. */
export const HONEYPOT_FIELD = 'website';

/** A post view from the same IP is counted at most once per hour (§6.4.8). */
export const VIEW_COUNTER_TTL_MS = 60 * 60 * 1000;
export const VIEW_COUNTER_MAX_ENTRIES = 10_000;

/** Upload constraints (§7). */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

/** Request body limits — the upload route gets its own, larger allowance. */
export const JSON_BODY_LIMIT = '1mb';
export const UPLOAD_BODY_LIMIT = 10 * 1024 * 1024;

/** Route-level throttle budgets (§7). */
export const LOGIN_THROTTLE = { limit: 5, ttl: 60_000 };
export const PUBLIC_FORM_THROTTLE = { limit: 3, ttl: 60_000 };
