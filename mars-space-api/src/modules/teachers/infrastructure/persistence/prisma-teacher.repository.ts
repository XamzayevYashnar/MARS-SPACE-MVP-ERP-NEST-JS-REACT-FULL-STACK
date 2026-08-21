import { Injectable } from '@nestjs/common';
import { Prisma, Teacher as PrismaTeacher } from '@prisma/client';
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
  CreateTeacherData,
  Teacher,
  TeacherQuery,
  TeacherSocials,
  UpdateTeacherData,
} from '../../domain/entities/teacher.entity';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';

/** Only published courses are ever attached to a teacher response. */
const PUBLISHED_COURSES_INCLUDE = {
  courses: {
    where: { course: { isPublished: true } },
    select: {
      course: { select: { id: true, slug: true, title: true, coverImageUrl: true } },
    },
  },
} satisfies Prisma.TeacherInclude;

type TeacherRow = PrismaTeacher & {
  courses?: Array<{
    course: { id: string; slug: string; title: Prisma.JsonValue; coverImageUrl: string | null };
  }>;
};

@Injectable()
export class PrismaTeacherRepository extends BasePrismaRepository implements TeacherRepository {
  protected readonly sortableColumns = [
    'sortOrder',
    'createdAt',
    'updatedAt',
    'fullName',
    'experienceYears',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: TeacherQuery): Promise<Paginated<Teacher>> {
    const where: Prisma.TeacherWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.courseId ? { courses: { some: { courseId: query.courseId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: this.containsInsensitive(query.search) },
              { skills: { has: query.search } },
              ...this.localizedContains('position', query.search),
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.teacher.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: PUBLISHED_COURSES_INCLUDE,
      }),
      this.prisma.teacher.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Teacher | null> {
    const row = await this.prisma.teacher.findUnique({
      where: { id },
      include: PUBLISHED_COURSES_INCLUDE,
    });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string, activeOnly: boolean): Promise<Teacher | null> {
    const row = await this.prisma.teacher.findFirst({
      where: { slug, ...(activeOnly ? { isActive: true } : {}) },
      include: PUBLISHED_COURSES_INCLUDE,
    });
    return row ? toDomain(row) : null;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.teacher.count({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    return (await this.prisma.teacher.count({ where: { id } })) > 0;
  }

  async create(data: CreateTeacherData): Promise<Teacher> {
    const row = await this.prisma.teacher.create({
      data: {
        slug: data.slug,
        fullName: data.fullName,
        position: toJsonInput(data.position),
        bio: toNullableJsonInput(data.bio),
        photoUrl: data.photoUrl ?? null,
        experienceYears: data.experienceYears ?? 0,
        skills: data.skills ?? [],
        socials: toNullableJsonInput(data.socials),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        ...(data.courseIds?.length
          ? { courses: { create: data.courseIds.map((courseId) => ({ courseId })) } }
          : {}),
      },
      include: PUBLISHED_COURSES_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateTeacherData): Promise<Teacher> {
    // Course assignment is replaced wholesale: the join table carries no other
    // state, so a diff would add complexity without adding behaviour.
    const row = await this.prisma.$transaction(async (tx) => {
      if (data.courseIds) {
        await tx.courseTeacher.deleteMany({ where: { teacherId: id } });
        if (data.courseIds.length > 0) {
          await tx.courseTeacher.createMany({
            data: data.courseIds.map((courseId) => ({ teacherId: id, courseId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.teacher.update({
        where: { id },
        data: {
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
          ...(data.position !== undefined ? { position: toJsonInput(data.position) } : {}),
          ...(data.bio !== undefined ? { bio: toNullableJsonInput(data.bio) } : {}),
          ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
          ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
          ...(data.skills !== undefined ? { skills: data.skills } : {}),
          ...(data.socials !== undefined ? { socials: toNullableJsonInput(data.socials) } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: PUBLISHED_COURSES_INCLUDE,
      });
    });

    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.teacher.delete({ where: { id } });
  }

  async countGroups(id: string): Promise<number> {
    return this.prisma.group.count({ where: { teacherId: id } });
  }

  async reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.teacher.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
  }
}

function toSocials(value: Prisma.JsonValue | null): TeacherSocials | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const read = (key: keyof TeacherSocials): string | undefined =>
    typeof record[key] === 'string' ? (record[key] as string) : undefined;

  return {
    telegram: read('telegram'),
    linkedin: read('linkedin'),
    github: read('github'),
    instagram: read('instagram'),
  };
}

function toDomain(row: TeacherRow): Teacher {
  return new Teacher(
    row.id,
    row.slug,
    row.fullName,
    toLocalizedText(row.position),
    toOptionalLocalizedText(row.bio),
    row.photoUrl,
    row.experienceYears,
    row.skills,
    toSocials(row.socials),
    row.sortOrder,
    row.isActive,
    row.createdAt,
    row.updatedAt,
    (row.courses ?? []).map(({ course }) => ({
      id: course.id,
      slug: course.slug,
      title: toLocalizedText(course.title),
      coverImageUrl: course.coverImageUrl,
    })),
  );
}
