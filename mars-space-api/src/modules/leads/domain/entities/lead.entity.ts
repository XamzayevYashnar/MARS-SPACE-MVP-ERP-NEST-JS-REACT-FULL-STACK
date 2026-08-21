import { LeadSource, LeadStatus } from '@prisma/client';
import { LocalizedText } from '../../../../common/interfaces';

export interface LeadCourseSummary {
  id: string;
  slug: string;
  title: LocalizedText;
}

export interface LeadAssigneeSummary {
  id: string;
  fullName: string;
  email: string;
}

export class Lead {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly phone: string,
    readonly courseId: string | null,
    readonly message: string | null,
    readonly source: LeadSource,
    readonly status: LeadStatus,
    readonly assignedToId: string | null,
    readonly adminNote: string | null,
    readonly utmSource: string | null,
    readonly utmMedium: string | null,
    readonly utmCampaign: string | null,
    readonly pageUrl: string | null,
    readonly contactedAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly course: LeadCourseSummary | null = null,
    readonly assignedTo: LeadAssigneeSummary | null = null,
  ) {}

  /** §6.4.3 — conversion is one-way; a second attempt is a conflict. */
  isConverted(): boolean {
    return this.status === LeadStatus.ENROLLED;
  }
}

export interface CreateLeadData {
  fullName: string;
  phone: string;
  courseId?: string | null;
  message?: string | null;
  source?: LeadSource;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  pageUrl?: string | null;
}

export interface UpdateLeadData {
  status?: LeadStatus;
  assignedToId?: string | null;
  adminNote?: string | null;
  contactedAt?: Date | null;
}

export interface LeadQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  courseId?: string;
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/** Aggregates behind `GET /admin/statistics/overview`. */
export interface LeadStatusCounts {
  NEW: number;
  IN_PROGRESS: number;
  CONTACTED: number;
  ENROLLED: number;
  REJECTED: number;
}

export interface LeadTrendPoint {
  date: string;
  count: number;
}

export interface TopCourseByLeads {
  courseId: string;
  title: LocalizedText;
  leadsCount: number;
}
