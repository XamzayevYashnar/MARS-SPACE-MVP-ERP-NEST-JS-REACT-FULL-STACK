import type { LeadSource, LeadStatus, Localized } from '@/shared/types/common.types';

export interface LeadCourseSummary {
  id: string;
  slug: string;
  title: Localized;
}

export interface LeadAssigneeSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  courseId: string | null;
  course: LeadCourseSummary | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  assignedToId: string | null;
  assignedTo: LeadAssigneeSummary | null;
  adminNote: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  pageUrl: string | null;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Public lead-creation payload (spec §9). */
export interface CreateLeadInput {
  fullName: string;
  phone: string;
  courseId?: string;
  message?: string;
  source?: LeadSource;
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface LeadFilters {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  courseId?: string;
  assignedToId?: string;
  search?: string;
  from?: string;
  to?: string;
}
