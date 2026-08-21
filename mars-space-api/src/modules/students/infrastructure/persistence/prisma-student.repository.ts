import { Injectable } from '@nestjs/common';
import { Prisma, Student as PrismaStudent, StudentStatus } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import { toLocalizedText } from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { EntityNotFoundException } from '../../../../common/exceptions';
import {
  CreateStudentData,
  Student,
  StudentQuery,
  UpdateStudentData,
} from '../../domain/entities/student.entity';
import { StudentRepository } from '../../domain/repositories/student.repository';

const STUDENT_INCLUDE = {
  group: {
    select: {
      id: true,
      name: true,
      courseId: true,
      course: { select: { title: true } },
    },
  },
} satisfies Prisma.StudentInclude;

type StudentRow = PrismaStudent & {
  group?: {
    id: string;
    name: string;
    courseId: string;
    course: { title: Prisma.JsonValue };
  } | null;
};

/** Statuses that no longer accept a new enrolment. */
const CLOSED_GROUP_STATUSES = ['FINISHED', 'CANCELLED'] as const;

@Injectable()
export class PrismaStudentRepository extends BasePrismaRepository implements StudentRepository {
  protected readonly sortableColumns = [
    'createdAt',
    'updatedAt',
    'enrolledAt',
    'fullName',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: StudentQuery): Promise<Paginated<Student>> {
    const where: Prisma.StudentWhereInput = {
      ...(query.groupId ? { groupId: query.groupId } : {}),
      ...(query.courseId ? { group: { courseId: query.courseId } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: this.containsInsensitive(query.search) },
              { phone: this.containsInsensitive(query.search) },
              { email: this.containsInsensitive(query.search) },
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.student.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: STUDENT_INCLUDE,
      }),
      this.prisma.student.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Student | null> {
    const row = await this.prisma.student.findUnique({ where: { id }, include: STUDENT_INCLUDE });
    return row ? toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<Student | null> {
    const row = await this.prisma.student.findFirst({
      where: { phone },
      include: STUDENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateStudentData): Promise<Student> {
    const row = await this.prisma.student.create({
      data: this.toCreateInput(data),
      include: STUDENT_INCLUDE,
    });
    return toDomain(row);
  }

  /**
   * §6.4.2 — the capacity check and the insert share one transaction.
   *
   * Two managers enrolling into the last seat at the same moment would both
   * pass a check made outside the transaction; running the count here means the
   * second one sees the first one's row and is rejected.
   */
  async createWithCapacityCheck(data: CreateStudentData & { groupId: string }): Promise<Student> {
    const row = await this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: data.groupId },
        select: { id: true, name: true, capacity: true, status: true },
      });

      if (!group) {
        throw new EntityNotFoundException('Group', data.groupId);
      }

      if ((CLOSED_GROUP_STATUSES as readonly string[]).includes(group.status)) {
        throw new GroupClosedForEnrolmentError(group.name, group.status);
      }

      const status = data.status ?? StudentStatus.ACTIVE;
      if (status === StudentStatus.ACTIVE) {
        const occupied = await tx.student.count({
          where: { groupId: group.id, status: StudentStatus.ACTIVE },
        });

        if (occupied >= group.capacity) {
          throw new GroupCapacityExceededError(group.name, group.capacity);
        }
      }

      return tx.student.create({
        data: this.toCreateInput(data),
        include: STUDENT_INCLUDE,
      });
    });

    return toDomain(row);
  }

  async moveToGroupWithCapacityCheck(id: string, groupId: string): Promise<Student> {
    const row = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!student) {
        throw new EntityNotFoundException('Student', id);
      }

      const group = await tx.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, capacity: true, status: true },
      });
      if (!group) {
        throw new EntityNotFoundException('Group', groupId);
      }

      if ((CLOSED_GROUP_STATUSES as readonly string[]).includes(group.status)) {
        throw new GroupClosedForEnrolmentError(group.name, group.status);
      }

      if (student.status === StudentStatus.ACTIVE) {
        const occupied = await tx.student.count({
          where: { groupId: group.id, status: StudentStatus.ACTIVE, NOT: { id } },
        });

        if (occupied >= group.capacity) {
          throw new GroupCapacityExceededError(group.name, group.capacity);
        }
      }

      return tx.student.update({
        where: { id },
        data: { groupId },
        include: STUDENT_INCLUDE,
      });
    });

    return toDomain(row);
  }

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const row = await this.prisma.student.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
        ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
      },
      include: STUDENT_INCLUDE,
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.student.delete({ where: { id } });
  }

  private toCreateInput(data: CreateStudentData): Prisma.StudentUncheckedCreateInput {
    return {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email ?? null,
      birthDate: data.birthDate ?? null,
      groupId: data.groupId ?? null,
      ...(data.status ? { status: data.status } : {}),
      note: data.note ?? null,
      ...(data.enrolledAt ? { enrolledAt: data.enrolledAt } : {}),
    };
  }
}

function toDomain(row: StudentRow): Student {
  return new Student(
    row.id,
    row.fullName,
    row.phone,
    row.email,
    row.birthDate,
    row.groupId,
    row.status,
    row.note,
    row.enrolledAt,
    row.createdAt,
    row.updatedAt,
    row.group
      ? {
          id: row.group.id,
          name: row.group.name,
          courseId: row.group.courseId,
          courseTitle: toLocalizedText(row.group.course.title),
        }
      : null,
  );
}
