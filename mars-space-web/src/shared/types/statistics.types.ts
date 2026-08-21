import type { LeadStatus, Localized } from './common.types';
import type { Lead } from '@/entities/lead/types';

export interface StatisticsTotals {
  courses: number;
  activeGroups: number;
  students: number;
  leadsThisMonth: number;
}

export interface LeadsTrendPoint {
  date: string;
  count: number;
}

export interface TopCourse {
  courseId: string;
  title: Localized;
  leadsCount: number;
}

export interface StatisticsOverview {
  totals: StatisticsTotals;
  leadsByStatus: Record<LeadStatus, number>;
  leadsTrend: LeadsTrendPoint[];
  topCourses: TopCourse[];
  recentLeads: Lead[];
}
