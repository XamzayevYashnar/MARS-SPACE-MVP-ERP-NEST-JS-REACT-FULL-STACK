import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/app.constants';
import {
  buildOrderBy,
  buildPaginationMeta,
  buildPaginationParams,
  paginate,
} from './pagination.util';

describe('buildPaginationParams', () => {
  it('applies the documented defaults for an empty query', () => {
    expect(buildPaginationParams()).toMatchObject({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      skip: 0,
      take: DEFAULT_LIMIT,
      sortOrder: 'desc',
    });
  });

  it('computes skip from page and limit', () => {
    expect(buildPaginationParams({ page: 3, limit: 10 })).toMatchObject({ skip: 20, take: 10 });
  });

  it('clamps the limit to MAX_LIMIT', () => {
    expect(buildPaginationParams({ limit: 5000 }).limit).toBe(MAX_LIMIT);
  });

  it('clamps a non-positive page and limit up to the minimum', () => {
    expect(buildPaginationParams({ page: 0, limit: 0 })).toMatchObject({ page: 1, limit: 1 });
    expect(buildPaginationParams({ page: -5 }).page).toBe(1);
  });

  it('trims search and drops it when only whitespace remains', () => {
    expect(buildPaginationParams({ search: '  react  ' }).search).toBe('react');
    expect(buildPaginationParams({ search: '   ' }).search).toBeUndefined();
  });
});

describe('buildPaginationMeta', () => {
  it('describes a middle page', () => {
    expect(buildPaginationMeta(48, 2, 12)).toEqual({
      page: 2,
      limit: 12,
      total: 48,
      totalPages: 4,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('marks the last page as having no next', () => {
    expect(buildPaginationMeta(48, 4, 12)).toMatchObject({ hasNext: false, hasPrev: true });
  });

  it('reports an empty result set as zero pages with no neighbours', () => {
    expect(buildPaginationMeta(0, 1, 12)).toMatchObject({
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('rounds a partial last page up', () => {
    expect(buildPaginationMeta(13, 1, 12).totalPages).toBe(2);
  });
});

describe('paginate', () => {
  it('pairs the items with their meta block', () => {
    const params = buildPaginationParams({ page: 1, limit: 2 });

    expect(paginate(['a', 'b'], 5, params)).toEqual({
      items: ['a', 'b'],
      meta: expect.objectContaining({ total: 5, totalPages: 3, hasNext: true }),
    });
  });
});

describe('buildOrderBy', () => {
  const allowed = ['createdAt', 'price'] as const;

  it('uses a whitelisted column', () => {
    expect(buildOrderBy('price', 'asc', allowed, 'createdAt')).toEqual({ price: 'asc' });
  });

  it('falls back to the default for an unknown column', () => {
    expect(buildOrderBy('passwordHash', 'desc', allowed, 'createdAt')).toEqual({
      createdAt: 'desc',
    });
  });

  it('falls back when sortBy is absent', () => {
    expect(buildOrderBy(undefined, 'asc', allowed, 'createdAt')).toEqual({ createdAt: 'asc' });
  });
});
