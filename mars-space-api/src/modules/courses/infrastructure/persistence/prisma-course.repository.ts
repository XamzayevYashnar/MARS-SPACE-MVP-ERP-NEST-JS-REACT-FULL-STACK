import { Injectable } from '@nestjs/common';
import { Course as PrismaCourse, GroupStatus, Prisma, StudentStatus } from '@prisma/client';
import { CourseSyllabusModule, Paginated } from '../../../../common/interfaces';
import {
  toJsonInput,
  toLocalizedStringList,
  toLocalizedText,
  toNullableJsonInput,
  toOptionalLocalizedText,
} from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  Course,
  CourseQuery,
  CreateCourseData,
  UpdateCourseData,
} from '../../domain/entities/course.entity';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CoursePrice } from '../../domain/value-objects/course-price.vo';

/** Relations attached to a list row — enough to render a course card. */
const LIST_INCLUDE = {
  category: { select: { id: true, slug: true, name: true, colorHex: true, iconKey: true } },
  teachers: {
    where: { teacher: { isActive: true } },
    select: {
      teacher: { select: { id: true, slug: true, fullName: true, position: true, photoUrl: true } },
    },
  },
} satisfies Prisma.CourseInclude;

/**
 * Detail rows additionally carry the open intakes and published reviews the
 * course page needs (§6.3). `_count` on students is what `freeSeats` is
 * computed from without a second round trip.
 */
const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  groups: {
    where: { status: { in: [GroupStatus.FORMING, GroupStatus.ACTIVE] } },
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      name: true,
      startDate: true,
      weekDays: true,
      startTime: true,
      endTime: true,
      status: true,
      capacity: true,
      _count: { select: { students: { where: { status: StudentStatus.ACTIVE } } } },
    },
  },
  testimonials: {
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      authorName: true,
      authorRole: true,
      avatarUrl: true,
      rating: true,
      content: true,
    },
  },
} satisfies Prisma.CourseInclude;

type CourseRow = PrismaCourse & {
  category?: {
    id: string;
    slug: string;
    name: Prisma.JsonValue;
    colorHex: string | null;
    iconKey: string | null;
  } | null;
  teachers?: Array<{
    teacher: {
      id: string;
      slug: string;
      fullName: string;
      position: Prisma.JsonValue;
      photoUrl: string | null;
    };
  }>;
  groups?: Array<{
    id: string;
    name: string;
    startDate: Date;
    weekDays: Course['groups'][number]['weekDays'];
    startTime: string;
    endTime: string;
    status: GroupStatus;
    capacity: number;
    _count: { students: number };
  }>;
  testimonials?: Array<{
    id: string;
    authorName: string;
    authorRole: Prisma.JsonValue;
    avatarUrl: string | null;
    rating: number;
    content: Prisma.JsonValue;
  }>;
};

@Injectable()
export class PrismaCourseRepository extends BasePrismaRepository implements CourseRepository {
  protected readonly sortableColumns = [
    'sortOrder',
    'createdAt',
    'updatedAt',
    'price',
    'durationMonths',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: CourseQuery): Promise<Paginated<Course>> {
    const where = this.buildWhere(query);

    const result = await this.paginateQuery(
      this.prisma.course.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: LIST_INCLUDE,
      }),
      this.prisma.course.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findFeatured(limit: number): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      include: LIST_INCLUDE,
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Course | null> {
    const row = await this.prisma.course.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string, publishedOnly: boolean): Promise<Course | null> {
    const row = await this.prisma.course.findFirst({
      where: { slug, ...(publishedOnly ? { isPublished: true } : {}) },
      include: DETAIL_INCLUDE,
    });
    return row ? toDomain(row) : null;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    return (await this.prisma.course.count({ where: { id } })) > 0;
  }

  async create(data: CreateCourseData): Promise<Course> {
    const row = await this.prisma.course.create({
      data: {
        slug: data.slug,
        title: toJsonInput(data.title),
        shortDescription: toJsonInput(data.shortDescription),
        description: toJsonInput(data.description),
        outcomes: toNullableJsonInput(data.outcomes),
        requirements: toNullableJsonInput(data.requirements),
        syllabus: toNullableJsonInput(data.syllabus),
        categoryId: data.categoryId,
        level: data.level,
        format: data.format,
        durationMonths: data.durationMonths,
        lessonsPerWeek: data.lessonsPerWeek,
        lessonMinutes: data.lessonMinutes ?? 90,
        price: new Prisma.Decimal(data.price),
        discountPrice: data.discountPrice != null ? new Prisma.Decimal(data.discountPrice) : null,
        currency: data.currency ?? 'UZS',
        coverImageUrl: data.coverImageUrl ?? null,
        promoVideoUrl: data.promoVideoUrl ?? null,
        metaTitle: toNullableJsonInput(data.metaTitle),
        metaDescription: toNullableJsonInput(data.metaDescription),
        isFeatured: data.isFeatured ?? false,
        isPublished: data.isPublished ?? false,
        sortOrder: data.sortOrder ?? 0,
        ...(data.teacherIds?.length
          ? { teachers: { create: data.teacherIds.map((teacherId) => ({ teacherId })) } }
          : {}),
      },
      include: DETAIL_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateCourseData): Promise<Course> {
    const row = await this.prisma.$transaction(async (tx) => {
      // Teacher assignment is replaced wholesale — the join table holds no
      // other state, so a diff would add complexity without adding behaviour.
      if (data.teacherIds) {
        await tx.courseTeacher.deleteMany({ where: { courseId: id } });
        if (data.teacherIds.length > 0) {
          await tx.courseTeacher.createMany({
            data: data.teacherIds.map((teacherId) => ({ courseId: id, teacherId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.course.update({
        where: { id },
        data: {
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.title !== undefined ? { title: toJsonInput(data.title) } : {}),
          ...(data.shortDescription !== undefined
            ? { shortDescription: toJsonInput(data.shortDescription) }
            : {}),
          ...(data.description !== undefined ? { description: toJsonInput(data.description) } : {}),
          ...(data.outcomes !== undefined ? { outcomes: toNullableJsonInput(data.outcomes) } : {}),
          ...(data.requirements !== undefined
            ? { requirements: toNullableJsonInput(data.requirements) }
            : {}),
          ...(data.syllabus !== undefined ? { syllabus: toNullableJsonInput(data.syllabus) } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.format !== undefined ? { format: data.format } : {}),
          ...(data.durationMonths !== undefined ? { durationMonths: data.durationMonths } : {}),
          ...(data.lessonsPerWeek !== undefined ? { lessonsPerWeek: data.lessonsPerWeek } : {}),
          ...(data.lessonMinutes !== undefined ? { lessonMinutes: data.lessonMinutes } : {}),
          ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
          ...(data.discountPrice !== undefined
            ? {
                discountPrice:
                  data.discountPrice === null ? null : new Prisma.Decimal(data.discountPrice),
              }
            : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
          ...(data.promoVideoUrl !== undefined ? { promoVideoUrl: data.promoVideoUrl } : {}),
          ...(data.metaTitle !== undefined
            ? { metaTitle: toNullableJsonInput(data.metaTitle) }
            : {}),
          ...(data.metaDescription !== undefined
            ? { metaDescription: toNullableJsonInput(data.metaDescription) }
            : {}),
          ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
          ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        },
        include: DETAIL_INCLUDE,
      });
    });

    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } });
  }

  async countGroups(id: string): Promise<number> {
    return this.prisma.group.count({ where: { courseId: id } });
  }

  private buildWhere(query: CourseQuery): Prisma.CourseWhereInput {
    const priceFilter =
      query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: new Prisma.Decimal(query.minPrice) } : {}),
              ...(query.maxPrice !== undefined ? { lte: new Prisma.Decimal(query.maxPrice) } : {}),
            },
          }
        : {};

    return {
      ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
      ...(query.isFeatured !== undefined ? { isFeatured: query.isFeatured } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.format ? { format: query.format } : {}),
      ...(query.teacherId ? { teachers: { some: { teacherId: query.teacherId } } } : {}),
      ...priceFilter,
      ...(query.search
        ? {
            OR: [
              { slug: this.containsInsensitive(query.search) },
              ...this.localizedContains('title', query.search),
              ...this.localizedContains('shortDescription', query.search),
            ],
          }
        : {}),
    };
  }
}

/** Reads the syllabus JSON column back into its typed shape. */
function toSyllabus(value: Prisma.JsonValue | null): CourseSyllabusModule[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .filter(
      (entry): entry is Prisma.JsonObject =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry),
    )
    .map((entry) => ({
      order: typeof entry['order'] === 'number' ? entry['order'] : 0,
      title: toLocalizedText(entry['title'] ?? null),
      durationWeeks: typeof entry['durationWeeks'] === 'number' ? entry['durationWeeks'] : 0,
      topics: toLocalizedStringList(entry['topics'] ?? null) ?? { uz: [], ru: [], en: [] },
    }))
    .sort((left, right) => left.order - right.order);
}

function toDomain(row: CourseRow): Course {
  return new Course(
    row.id,
    row.slug,
    toLocalizedText(row.title),
    toLocalizedText(row.shortDescription),
    toLocalizedText(row.description),
    toLocalizedStringList(row.outcomes),
    toLocalizedStringList(row.requirements),
    toSyllabus(row.syllabus),
    row.categoryId,
    row.level,
    row.format,
    row.durationMonths,
    row.lessonsPerWeek,
    row.lessonMinutes,
    CoursePrice.create(
      row.price.toNumber(),
      row.discountPrice ? row.discountPrice.toNumber() : null,
      row.currency,
    ),
    row.coverImageUrl,
    row.promoVideoUrl,
    toOptionalLocalizedText(row.metaTitle),
    toOptionalLocalizedText(row.metaDescription),
    row.isFeatured,
    row.isPublished,
    row.sortOrder,
    row.createdAt,
    row.updatedAt,
    row.category
      ? {
          id: row.category.id,
          slug: row.category.slug,
          name: toLocalizedText(row.category.name),
          colorHex: row.category.colorHex,
          iconKey: row.category.iconKey,
        }
      : null,
    (row.teachers ?? []).map(({ teacher }) => ({
      id: teacher.id,
      slug: teacher.slug,
      fullName: teacher.fullName,
      position: toLocalizedText(teacher.position),
      photoUrl: teacher.photoUrl,
    })),
    (row.groups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      startDate: group.startDate,
      weekDays: group.weekDays,
      startTime: group.startTime,
      endTime: group.endTime,
      status: group.status,
      capacity: group.capacity,
      freeSeats: Math.max(0, group.capacity - group._count.students),
    })),
    (row.testimonials ?? []).map((testimonial) => ({
      id: testimonial.id,
      authorName: testimonial.authorName,
      authorRole: toOptionalLocalizedText(testimonial.authorRole),
      avatarUrl: testimonial.avatarUrl,
      rating: testimonial.rating,
      content: toLocalizedText(testimonial.content),
    })),
  );
}
