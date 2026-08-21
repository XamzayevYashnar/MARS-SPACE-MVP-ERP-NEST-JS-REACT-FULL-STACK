import { UZ_PHONE_REGEX } from '../constants/regex';

/**
 * Normalises an Uzbek phone number to `+998XXXXXXXXX` (§6.4.6).
 *
 * Accepts the shapes people actually type — `998 90 123 45 67`,
 * `+998-90-123-45-67`, `90 123 45 67` — and returns `null` when the input
 * cannot be read as a valid number, so the caller decides how to report it.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) {
    return null;
  }

  // A bare 9-digit local number gets the country code prefixed.
  const candidate = digits.length === 9 ? `+998${digits}` : `+${digits}`;

  return UZ_PHONE_REGEX.test(candidate) ? candidate : null;
}

export function isValidUzbekPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
