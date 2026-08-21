import i18n from '@/shared/config/i18n';
import { ApiError } from '@/shared/types/api.types';

// The error code is a runtime value from the server, so this lookup is dynamic;
// use a string-keyed view of t() rather than the statically-typed keys.
const translate = i18n.t.bind(i18n) as (key: string, options?: Record<string, unknown>) => string;

/**
 * Map an error to a user-facing, translated message (spec §7.4): prefer a
 * translation for the server error code, then the server message, then a
 * generic fallback. Safe to call outside React (uses the i18n instance).
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `validation:errors.${error.code}`;
    if (i18n.exists(key)) return translate(key);
    if (error.message) return error.message;
  }
  return translate('validation:errors.UNKNOWN');
}

/** Extract server-side field errors so forms can map them via setError. */
export function getFieldErrors(error: unknown): { field: string; message: string }[] {
  return error instanceof ApiError ? (error.details ?? []) : [];
}
