/**
 * Uzbek phone helpers. Canonical stored form is `+998XXXXXXXXX` (E.164).
 */

/** Strip everything except digits and a leading plus. */
export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

/** Pretty-print a canonical number: `+998 (90) 123-45-67`. */
export function formatPhone(input: string): string {
  const digits = normalizePhone(input).replace(/^\+/, '');
  if (!digits.startsWith('998') || digits.length < 12) return input;
  const n = digits.slice(3); // 9 national digits
  return `+998 (${n.slice(0, 2)}) ${n.slice(2, 5)}-${n.slice(5, 7)}-${n.slice(7, 9)}`;
}

/** Build a `tel:` href from any user-entered phone. */
export function phoneHref(input: string): string {
  return `tel:${normalizePhone(input)}`;
}
