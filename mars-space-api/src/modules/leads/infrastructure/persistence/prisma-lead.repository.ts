import { Injectable } from '@nestjs/common';
import { Lead as PrismaLead, LeadStatus, Prisma, StudentStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { Paginated } from '../../../../common/interfaces';
import { toLocalizedText } from '../../../../common/utils/localized-text.util';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import {
  CreateLeadData,
  Lead,
  LeadQuery,
  LeadStatusCounts,
  LeadTrendPoint,
  TopCourseByLeads,
  UpdateLeadData,
} from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';

const LEAD_INCLUDE = {
  course: { select: { id: true, slug: true, title: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.LeadInclude;

type LeadRow = PrismaLead & {
  course?: { id: string; slug: string; title: Prisma.JsonValue } | null;
  assignedTo?: { id: string; fullName: string; email: string } | null;
};

const CLOSED_GROUP_STATUSES = ['FINISHED', 'CANCELLED'] as const;

@Injectable()
export class PrismaLeadRepository extends BasePrismaRepository implements LeadRepository {
  protected readonly sortableColumns = ['createdAt', 'updatedAt', 'fullName', 'status'] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: LeadQuery): Promise<Paginated<Lead>> {
    const where: Prisma.LeadWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: this.containsInsensitive(query.search) },
              { phone: this.containsInsensitive(query.search) },
              { message: this.containsInsensitive(query.search) },
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.lead.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
        include: LEAD_INCLUDE,
      }),
      this.prisma.lead.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await this.prisma.lead.findUnique({ where: { id }, include: LEAD_INCLUDE });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateLeadData): Promise<Lead> {
    const row = await this.prisma.lead.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        courseId: data.courseId ?? null,
        message: data.message ?? null,
        ...(data.source ? { source: data.source } : {}),
        utmSource: data.utmSource ?? null,
        utmMedium: data.utmMedium ?? null,
        utmCampaign: data.utmCampaign ?? null,
        pageUrl: data.pageUrl ?? null,
      },
      include: LEAD_INCLUDE,
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateLeadData): Promise<Lead> {
    const row = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
        ...(data.adminNote !== undefined ? { adminNote: data.adminNote } : {}),
        ...(data.contactedAt !== undefined ? { contactedAt: data.contactedAt } : {}),
      },
      include: LEAD_INCLUDE,
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lead.delete({ where: { id } });
  }

  async convertToStudent(input: {
    leadId: string;
    groupId: string;
    note?: string | null;
  }): Promise<{ lead: Lead; studentId: string }> {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
      if (!lead) {
        throw new EntityNotFoundException('Lead', input.leadId);
      }

      // Re-read inside the transaction: two managers converting the same lead
      // must produce one student and one 409, not two students.
      if (lead.status === LeadStatus.ENROLLED) {
        throw new BusinessRuleException('This lead has already been converted into a student');
      }

      const group = await tx.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, name: true, capacity: true, status: true },
      });
      if (!group) {
        throw new EntityNotFoundException('Group', input.groupId);
      }

      if ((CLOSED_GROUP_STATUSES as readonly string[]).includes(group.status)) {
        throw new GroupClosedForEnrolmentError(group.name, group.status);
      }

      const occupied = await tx.student.count({
        where: { groupId: group.id, status: StudentStatus.ACTIVE },
      });
      if (occupied >= group.capacity) {
        throw new GroupCapacityExceededError(group.name, group.capacity);
      }

      const student = await tx.student.create({
        data: {
          fullName: lead.fullName,
          phone: lead.phone,
          groupId: group.id,
          status: StudentStatus.ACTIVE,
          note: input.note ?? null,
        },
        select: { id: true },
      });

      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.ENROLLED,
          contactedAt: lead.contactedAt ?? new Date(),
        },
        include: LEAD_INCLUDE,
      });

      return { lead: toDomain(updated), studentId: student.id };
    });
  }

  // ── Dashboard aggregates ───────────────────────────────────

  async countByStatus(): Promise<LeadStatusCounts> {
    const rows = await this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } });

    const counts: LeadStatusCounts = {
      NEW: 0,
      IN_PROGRESS: 0,
      CONTACTED: 0,
      ENROLLED: 0,
      REJECTED: 0,
    };

    for (const row of rows) {
      counts[row.status] = row._count._all;
    }

    return counts;
  }

  async countSince(since: Date): Promise<number> {
    return this.prisma.lead.count({ where: { createdAt: { gte: since } } });
  }

  async trend(since: Date): Promise<LeadTrendPoint[]> {
    // Grouping by day is done in SQL: pulling every lead into Node just to
    // bucket it would scale with the table rather than with the chart.
    const rows = await this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>(
      Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS date, COUNT(*) AS count
        FROM "leads"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      count: Number(row.count),
    }));
  }

  async topCourses(limit: number): Promise<TopCourseByLeads[]> {
    const grouped = await this.prisma.lead.groupBy({
      by: ['courseId'],
      where: { courseId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: limit,
    });

    const courseIds = grouped
      .map((row) => row.courseId)
      .filter((courseId): courseId is string => courseId !== null);

    if (courseIds.length === 0) {
      return [];
    }

    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    });
    const titleById = new Map(courses.map((course) => [course.id, course.title]));

    return grouped
      .filter((row): row is typeof row & { courseId: string } => row.courseId !== null)
      .map((row) => ({
        courseId: row.courseId,
        title: toLocalizedText(titleById.get(row.courseId) ?? null),
        leadsCount: row._count._all,
      }));
  }

  async recent(limit: number): Promise<Lead[]> {
    const rows = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: LEAD_INCLUDE,
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: LeadRow): Lead {
  return new Lead(
    row.id,
    row.fullName,
    row.phone,
    row.courseId,
    row.message,
    row.source,
    row.status,
    row.assignedToId,
    row.adminNote,
    row.utmSource,
    row.utmMedium,
    row.utmCampaign,
    row.pageUrl,
    row.contactedAt,
    row.createdAt,
    row.updatedAt,
    row.course
      ? { id: row.course.id, slug: row.course.slug, title: toLocalizedText(row.course.title) }
      : null,
    row.assignedTo
      ? { id: row.assignedTo.id, fullName: row.assignedTo.fullName, email: row.assignedTo.email }
      : null,
  );
}
