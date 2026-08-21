import { Injectable } from '@nestjs/common';
import { Prisma, Testimonial as PrismaTestimonial } from '@prisma/client';
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
  CreateTestimonialData,
  Testimonial,
  TestimonialQuery,
  UpdateTestimonialData,
} from '../../domain/entities/testimonial.entity';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';

const TESTIMONIAL_INCLUDE = {
  course: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.TestimonialInclude;

type TestimonialRow = PrismaTestimonial & {
  course?: { id: string; slug: string; title: Prisma.JsonValue } | null;
};

@Injectable()
export class PrismaTestimonialRepository
  extends BasePrismaRepository
  implements TestimonialRepository
{
  protected readonly sortableColumns = ['sortOrder', 'createdAt', 'rating'] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: TestimonialQuery): Promise<Paginated<Testimonial>> {
    const where: Prisma.TestimonialWhereInput = {
      ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.courseSlug ? { course: { slug: query.courseSlug } } : {}),
      ...(query.minRating !== undefined ? { rating: { gte: query.minRating } } : {}),
      ...(query.search
        ? {
            OR: [
              { authorName: this.containsInsensitive(query.search) },
              ...this.localizedContains('content', query.search),
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.testimonial.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: TESTIMONIAL_INCLUDE,
      }),
      this.prisma.testimonial.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Testimonial | null> {
    const row = await this.prisma.testimonial.findUnique({
      where: { id },
      include: TESTIMONIAL_INCLUDE,
    });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateTestimonialData): Promise<Testimonial> {
    const row = await this.prisma.testimonial.create({
      data: {
        authorName: data.authorName,
        authorRole: toNullableJsonInput(data.authorRole),
        avatarUrl: data.avatarUrl ?? null,
        courseId: data.courseId ?? null,
        rating: data.rating ?? 5,
        content: toJsonInput(data.content),
        videoUrl: data.videoUrl ?? null,
        isPublished: data.isPublished ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
      include: TESTIMONIAL_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateTestimonialData): Promise<Testimonial> {
    const row = await this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.authorName !== undefined ? { authorName: data.authorName } : {}),
        ...(data.authorRole !== undefined
          ? { authorRole: toNullableJsonInput(data.authorRole) }
          : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.content !== undefined ? { content: toJsonInput(data.content) } : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
      include: TESTIMONIAL_INCLUDE,
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.testimonial.delete({ where: { id } });
  }
}

function toDomain(row: TestimonialRow): Testimonial {
  return new Testimonial(
    row.id,
    row.authorName,
    toOptionalLocalizedText(row.authorRole),
    row.avatarUrl,
    row.courseId,
    row.rating,
    toLocalizedText(row.content),
    row.videoUrl,
    row.isPublished,
    row.sortOrder,
    row.createdAt,
    row.updatedAt,
    row.course
      ? { id: row.course.id, slug: row.course.slug, title: toLocalizedText(row.course.title) }
      : null,
  );
}
