import { PrismaPromise } from '@prisma/client';
import { Paginated, PaginationParams } from '../common/interfaces';
import { buildOrderBy, paginate } from '../common/utils/pagination.util';
import { PrismaService } from './prisma.service';

/**
 * Shared pagination and sorting plumbing for the Prisma repositories.
 *
 * It deliberately holds no query building of its own: each repository knows its
 * own `where` shape, and hiding that behind a generic base class would trade
 * clarity for a few saved lines.
 */
export abstract class BasePrismaRepository {
  protected constructor(protected readonly prisma: PrismaService) {}

  /** Columns `?sortBy=` may name for this repository. */
  protected abstract readonly sortableColumns: readonly string[];

  /** Column used when `sortBy` is absent or not whitelisted. */
  protected readonly defaultSortColumn: string = 'createdAt';

  protected orderBy(params: PaginationParams): Record<string, 'asc' | 'desc'> {
    return buildOrderBy(
      params.sortBy,
      params.sortOrder,
      this.sortableColumns,
      this.defaultSortColumn,
    );
  }

  /**
   * Runs the `findMany` + `count` pair inside one transaction so the total
   * always matches the page that was read.
   */
  protected async paginateQuery<T>(
    findMany: PrismaPromise<T[]>,
    count: PrismaPromise<number>,
    params: PaginationParams,
  ): Promise<Paginated<T>> {
    const [items, total] = await this.prisma.$transaction([findMany, count]);
    return paginate(items, total, params);
  }

  /** Case-insensitive `contains` filter, the search mode used across the API. */
  protected containsInsensitive(search: string) {
    return { contains: search, mode: 'insensitive' as const };
  }

  /**
   * Search filter over a localised JSONB column.
   *
   * Prisma cannot do a case-insensitive `contains` inside JSON, so localised
   * search matches per locale with `string_contains`. It is exact-case for
   * non-latin scripts, which is an accepted MVP trade-off (see DECISIONS.md).
   */
  protected localizedContains(column: string, search: string) {
    return [
      { [column]: { path: ['uz'], string_contains: search } },
      { [column]: { path: ['ru'], string_contains: search } },
      { [column]: { path: ['en'], string_contains: search } },
    ];
  }
}
