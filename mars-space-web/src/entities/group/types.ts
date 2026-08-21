import type { GroupStatus, Localized, WeekDay } from '@/shared/types/common.types';

export interface GroupCourseSummary {
  id: string;
  slug: string;
  title: Localized;
}

export interface GroupTeacherSummary {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
}

/** A row on the Mission Board / upcoming intakes (spec §4.7). */
export interface UpcomingGroup {
  id: string;
  name: string;
  courseId: string;
  course: GroupCourseSummary | null;
  teacher: GroupTeacherSummary | null;
  startDate: string;
  endDate: string | null;
  weekDays: WeekDay[];
  startTime: string;
  endTime: string;
  roomName: string | null;
  capacity: number;
  activeStudentsCount: number;
  freeSeats: number;
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
}

/** Full group record (admin). */
export type Group = UpcomingGroup;
