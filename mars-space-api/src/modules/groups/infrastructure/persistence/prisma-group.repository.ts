import { Injectable } from '@nestjs/common';
import { Group as PrismaGroup, GroupStatus, Prisma, StudentStatus } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import { toLocalizedText } from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  CreateGroupData,
  Group,
  GroupQuery,
  UpdateGroupData,
} from '../../domain/entities/group.entity';
import { GroupRepository } from '../../domain/repositories/group.repository';

const GROUP_INCLUDE = {
  course: { select: { id: true, slug: true, title: true } },
  teacher: { select: { id: true, slug: true, fullName: true, photoUrl: true } },
  // Only ACTIVE students occupy a seat, so a dropped student frees one.
  _count: { select: { students: { where: { status: StudentStatus.ACTIVE } } } },
} satisfies Prisma.GroupInclude;

type GroupRow = PrismaGroup & {
  course?: { id: string; slug: string; title: Prisma.JsonValue } | null;
  teacher?: { id: string; slug: string; fullName: string; photoUrl: string | null } | null;
  _count?: { students: number };
};

@Injectable()
export class PrismaGroupRepository extends BasePrismaRepository implements GroupRepository {
  protected readonly sortableColumns = [
    'startDate',
    'createdAt',
    'updatedAt',
    'name',
    'capacity',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: GroupQuery): Promise<Paginated<Group>> {
    const where: Prisma.GroupWhereInput = {
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.teacherId ? { teacherId: query.teacherId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.upcomingOnly
        ? { status: GroupStatus.FORMING, startDate: { gte: startOfToday() } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: this.containsInsensitive(query.search) },
              { roomName: this.containsInsensitive(query.search) },
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.group.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: GROUP_INCLUDE,
      }),
      this.prisma.group.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Group | null> {
    const row = await this.prisma.group.findUnique({ where: { id }, include: GROUP_INCLUDE });
    return row ? toDomain(row) : null;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.group.count({
      where: { name, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreateGroupData): Promise<Group> {
    const row = await this.prisma.group.create({
      data: {
        name: data.name,
        courseId: data.courseId,
        teacherId: data.teacherId ?? null,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        weekDays: data.weekDays,
        startTime: data.startTime,
        endTime: data.endTime,
        roomName: data.roomName ?? null,
        capacity: data.capacity ?? 15,
        ...(data.status ? { status: data.status } : {}),
      },
      include: GROUP_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateGroupData): Promise<Group> {
    const row = await this.prisma.group.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.weekDays !== undefined ? { weekDays: data.weekDays } : {}),
        ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
        ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
        ...(data.roomName !== undefined ? { roomName: data.roomName } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: GROUP_INCLUDE,
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.group.delete({ where: { id } });
  }

  async countStudents(id: string): Promise<number> {
    return this.prisma.student.count({ where: { groupId: id } });
  }
}

/** Local midnight — "upcoming" includes an intake starting later today. */
function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDomain(row: GroupRow): Group {
  return new Group(
    row.id,
    row.name,
    row.courseId,
    row.teacherId,
    row.startDate,
    row.endDate,
    row.weekDays,
    row.startTime,
    row.endTime,
    row.roomName,
    row.capacity,
    row.status,
    row.createdAt,
    row.updatedAt,
    row._count?.students ?? 0,
    row.course
      ? { id: row.course.id, slug: row.course.slug, title: toLocalizedText(row.course.title) }
      : null,
    row.teacher
      ? {
          id: row.teacher.id,
          slug: row.teacher.slug,
          fullName: row.teacher.fullName,
          photoUrl: row.teacher.photoUrl,
        }
      : null,
  );
}
