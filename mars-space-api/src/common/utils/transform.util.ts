/**
 * `class-transformer` helpers for query strings.
 *
 * Query parameters always arrive as strings, so `@Type(() => Boolean)` would
 * turn the literal `"false"` into `true`. These transforms are the shared fix.
 */

interface TransformArgument {
  value: unknown;
}

/** `"true"`/`"false"` → boolean; anything else → `undefined` (filter absent). */
export function toOptionalBoolean({ value }: TransformArgument): boolean | undefined {
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return undefined;
}

/** Trims a string parameter and drops it when nothing is left. */
export function toTrimmedString({ value }: TransformArgument): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Splits a comma-separated query parameter into a trimmed list. */
export function toStringArray({ value }: TransformArgument): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}
