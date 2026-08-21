import { slugify } from '../../../../common/utils/slugify.util';

/**
 * Lowercases, slugifies and de-duplicates tags.
 *
 * Filtering is an exact `has` match on the array column, so the write side has
 * to be the place that settles on one canonical spelling.
 */
export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  const normalized = tags.map((tag) => slugify(tag)).filter((tag) => tag.length > 0);

  return [...new Set(normalized)];
}
