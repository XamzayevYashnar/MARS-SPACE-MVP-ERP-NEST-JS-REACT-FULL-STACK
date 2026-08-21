import { Injectable } from '@nestjs/common';
import { Category as PrismaCategory, Prisma } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import {
  toJsonInput,
  toLocalizedText,
  toNullableJsonInput,
  toOptionalLocalizedText,
} from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  Category,
  CategoryQuery,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/repositories/category.repository';

/** Row shape once the course count is included. */
type CategoryRow = PrismaCategory & { _count?: { courses: number } };

@Injectable()
export class PrismaCategoryRepository extends BasePrismaRepository implements CategoryRepository {
  protected readonly sortableColumns = ['sortOrder', 'createdAt', 'updatedAt', 'slug'] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: CategoryQuery): Promise<Paginated<Category>> {
    const where: Prisma.CategoryWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { slug: this.containsInsensitive(query.search) },
              ...this.localizedContains('name', query.search),
            ],
          }
        : {}),
    };

    // The public listing counts published courses only, so a category whose
    // courses are all drafts shows up as empty rather than misleadingly full.
    const countFilter = query.publishedCoursesOnly
      ? { courses: { where: { isPublished: true } } }
      : { courses: true };

    const result = await this.paginateQuery(
      this.prisma.category.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: { _count: { select: countFilter } },
      }),
      this.prisma.category.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string, activeOnly: boolean): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { slug, ...(activeOnly ? { isActive: true } : {}) },
      include: { _count: { select: { courses: { where: { isPublished: true } } } } },
    });
    return row ? toDomain(row) : null;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        slug: data.slug,
        name: toJsonInput(data.name),
        description: toNullableJsonInput(data.description),
        iconKey: data.iconKey ?? null,
        colorHex: data.colorHex ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: { _count: { select: { courses: true } } },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.name !== undefined ? { name: toJsonInput(data.name) } : {}),
        ...(data.description !== undefined
          ? { description: toNullableJsonInput(data.description) }
          : {}),
        ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
        ...(data.colorHex !== undefined ? { colorHex: data.colorHex } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { _count: { select: { courses: true } } },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async countCourses(id: string): Promise<number> {
    return this.prisma.course.count({ where: { categoryId: id } });
  }

  async reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }
}

function toDomain(row: CategoryRow): Category {
  return new Category(
    row.id,
    row.slug,
    toLocalizedText(row.name),
    toOptionalLocalizedText(row.description),
    row.iconKey,
    row.colorHex,
    row.sortOrder,
    row.isActive,
    row.createdAt,
    row.updatedAt,
    row._count?.courses ?? 0,
  );
}
