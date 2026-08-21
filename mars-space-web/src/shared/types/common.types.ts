import type { Language } from '@/shared/config/constants';

/**
 * Localised content shape from the API (spec §7.2). Public endpoints may flatten
 * this to a plain string when `?lang=` is sent — the web client never sends it,
 * so it always receives the full object, but `localize()` handles both.
 */
export interface LocalizedText {
  uz: string;
  ru: string;
  en: string;
}

export interface LocalizedStringList {
  uz: string[];
  ru: string[];
  en: string[];
}

/** A localised value as it can arrive over the wire. */
export type Localized = LocalizedText | string;
export type LocalizedList = LocalizedStringList | string[];

export type { Language };

/** Domain enums — string unions mirroring the Prisma schema. */
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseFormat = 'OFFLINE' | 'ONLINE' | 'HYBRID';
export type GroupStatus = 'FORMING' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'CANCELLED';
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'FROZEN' | 'DROPPED';
export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'CONTACTED' | 'ENROLLED' | 'REJECTED';
export type LeadSource =
  | 'WEBSITE_FORM'
  | 'COURSE_PAGE'
  | 'HERO_FORM'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'PHONE'
  | 'WALK_IN'
  | 'OTHER';
export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const COURSE_LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
export const COURSE_FORMATS: CourseFormat[] = ['OFFLINE', 'ONLINE', 'HYBRID'];
export const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'CONTACTED',
  'ENROLLED',
  'REJECTED',
];
export const WEEK_DAYS: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** One module of a course syllabus (spec §6.3). */
export interface CourseSyllabusModule {
  order: number;
  title: Localized;
  durationWeeks: number;
  topics: LocalizedList;
}

/** Computed price object returned by the API (never a raw Decimal). */
export interface CoursePrice {
  amount: number;
  discountAmount: number | null;
  effectiveAmount: number;
  discountPercent: number | null;
  currency: string;
}
