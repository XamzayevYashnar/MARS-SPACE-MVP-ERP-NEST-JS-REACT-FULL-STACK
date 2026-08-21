import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { LocalizedText } from '../../../../common/interfaces';
import { LeadResponseDto } from '../../../leads/application/dto/lead.dto';

export class StatisticsTotalsDto {
  @ApiProperty({ example: 12, description: 'Published courses' })
  courses!: number;

  @ApiProperty({ example: 7, description: 'Groups with status ACTIVE' })
  activeGroups!: number;

  @ApiProperty({ example: 143, description: 'Students with status ACTIVE' })
  students!: number;

  @ApiProperty({ example: 61, description: 'Leads created since the first of this month' })
  leadsThisMonth!: number;
}

export class LeadsByStatusDto implements Record<LeadStatus, number> {
  @ApiProperty({ example: 14 }) NEW!: number;
  @ApiProperty({ example: 9 }) IN_PROGRESS!: number;
  @ApiProperty({ example: 21 }) CONTACTED!: number;
  @ApiProperty({ example: 12 }) ENROLLED!: number;
  @ApiProperty({ example: 5 }) REJECTED!: number;
}

export class LeadsTrendPointDto {
  @ApiProperty({ example: '2026-08-01', description: 'Day, in the API timezone' })
  date!: string;

  @ApiProperty({ example: 4 })
  count!: number;
}

export class TopCourseDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  courseId!: string;

  @ApiProperty({ description: 'LocalizedText title of the course' })
  title!: LocalizedText;

  @ApiProperty({ example: 23 })
  leadsCount!: number;
}

/** Payload of `GET /admin/statistics/overview` (§6.3). */
export class StatisticsOverviewDto {
  @ApiProperty({ type: StatisticsTotalsDto })
  totals!: StatisticsTotalsDto;

  @ApiProperty({ type: LeadsByStatusDto })
  leadsByStatus!: LeadsByStatusDto;

  @ApiProperty({
    type: [LeadsTrendPointDto],
    description: 'Daily lead counts for the last 30 days',
  })
  leadsTrend!: LeadsTrendPointDto[];

  @ApiProperty({ type: [TopCourseDto], description: 'Courses attracting the most leads' })
  topCourses!: TopCourseDto[];

  @ApiProperty({ type: [LeadResponseDto], description: 'The five most recent leads' })
  recentLeads!: LeadResponseDto[];
}
