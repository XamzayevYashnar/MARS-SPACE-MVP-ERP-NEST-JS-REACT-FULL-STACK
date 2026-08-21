import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/app.constants';
import { Language } from '../enums/language.enum';
import { Paginated, PaginationMeta, PaginationParams } from '../interfaces';

export interface RawPaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  lang?: Language;
}

/**
 * Turns raw query params into the normalised shape every list use case takes.
 * Out-of-range values are clamped rather than rejected — the DTO already
 * rejects malformed input, this guards against integer-overflow style abuse.
 */
export function buildPaginationParams(input: RawPaginationInput = {}): PaginationParams {
  const page = Math.max(DEFAULT_PAGE, Math.trunc(input.page ?? DEFAULT_PAGE));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(input.limit ?? DEFAULT_LIMIT)));
  const search = input.search?.trim();

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder ?? 'desc',
    search: search && search.length > 0 ? search : undefined,
    lang: input.lang,
  };
}

/** Builds the `meta` block of a paginated response envelope. */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const safeLimit = Math.max(1, limit);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1 && total > 0,
  };
}

/** Convenience wrapper used by every repository `findMany` implementation. */
export function paginate<T>(items: T[], total: number, params: PaginationParams): Paginated<T> {
  return { items, meta: buildPaginationMeta(total, params.page, params.limit) };
}

/**
 * Whitelists `sortBy` before it reaches Prisma's `orderBy`.
 * An unknown column silently falls back to the caller's default, which keeps a
 * crafted query string from probing the schema.
 */
export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  allowed: readonly T[],
  fallback: T,
): Record<string, 'asc' | 'desc'> {
  const column = allowed.includes(sortBy as T) ? (sortBy as T) : fallback;
  return { [column]: sortOrder };
}
