import { Injectable } from '@nestjs/common';
import { LeadMapper } from '../../../leads/application/mappers/lead.mapper';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository';
import { StatisticsRepository } from '../../domain/repositories/statistics.repository';
import { StatisticsOverviewDto } from '../dto/statistics.dto';

const TREND_DAYS = 30;
const TOP_COURSES_LIMIT = 5;
const RECENT_LEADS_LIMIT = 5;

@Injectable()
export class GetOverviewUseCase {
  constructor(
    private readonly statisticsRepository: StatisticsRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  /**
   * Dashboard payload of §6.3.
   *
   * The six queries are independent, so they run concurrently — the dashboard
   * is the first screen an operator sees and should not wait on a serial chain.
   */
  async execute(): Promise<StatisticsOverviewDto> {
    const monthStart = startOfCurrentMonth();
    const trendStart = daysAgo(TREND_DAYS);

    const [totals, leadsByStatus, leadsThisMonth, leadsTrend, topCourses, recentLeads] =
      await Promise.all([
        this.statisticsRepository.entityTotals(),
        this.leadRepository.countByStatus(),
        this.leadRepository.countSince(monthStart),
        this.leadRepository.trend(trendStart),
        this.leadRepository.topCourses(TOP_COURSES_LIMIT),
        this.leadRepository.recent(RECENT_LEADS_LIMIT),
      ]);

    return {
      totals: {
        courses: totals.publishedCourses,
        activeGroups: totals.activeGroups,
        students: totals.activeStudents,
        leadsThisMonth,
      },
      leadsByStatus,
      // Days with no leads are filled in, so the chart shows a continuous line
      // instead of silently compressing quiet periods.
      leadsTrend: fillMissingDays(leadsTrend, trendStart, TREND_DAYS),
      topCourses,
      recentLeads: LeadMapper.toResponseList(recentLeads),
    };
  }
}

function startOfCurrentMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days + 1);
  return date;
}

function fillMissingDays(
  points: Array<{ date: string; count: number }>,
  from: Date,
  days: number,
): Array<{ date: string; count: number }> {
  const countByDate = new Map(points.map((point) => [point.date, point.count]));
  const filled: Array<{ date: string; count: number }> = [];

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + offset);
    const key = toDateKey(day);
    filled.push({ date: key, count: countByDate.get(key) ?? 0 });
  }

  return filled;
}

/** Local calendar day, so the buckets line up with `date_trunc` in Postgres. */
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
