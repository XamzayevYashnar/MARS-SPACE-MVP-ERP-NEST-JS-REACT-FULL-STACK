import { Injectable } from '@nestjs/common';
import { GroupStatus, StudentStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  EntityTotals,
  StatisticsRepository,
} from '../../domain/repositories/statistics.repository';

@Injectable()
export class PrismaStatisticsRepository implements StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async entityTotals(): Promise<EntityTotals> {
    // One transaction so the three counts describe the same instant.
    const [publishedCourses, activeGroups, activeStudents] = await this.prisma.$transaction([
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.group.count({ where: { status: GroupStatus.ACTIVE } }),
      this.prisma.student.count({ where: { status: StudentStatus.ACTIVE } }),
    ]);

    return { publishedCourses, activeGroups, activeStudents };
  }
}
