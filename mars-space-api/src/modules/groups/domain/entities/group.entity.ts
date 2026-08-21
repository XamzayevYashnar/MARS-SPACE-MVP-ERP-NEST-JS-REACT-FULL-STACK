import { GroupStatus, WeekDay } from '@prisma/client';
import { LocalizedText } from '../../../../common/interfaces';

export interface GroupCourseSummary {
  id: string;
  slug: string;
  title: LocalizedText;
}

export interface GroupTeacherSummary {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
}

export class Group {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly courseId: string,
    readonly teacherId: string | null,
    readonly startDate: Date,
    readonly endDate: Date | null,
    readonly weekDays: WeekDay[],
    readonly startTime: string,
    readonly endTime: string,
    readonly roomName: string | null,
    readonly capacity: number,
    readonly status: GroupStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    /** Students currently counted against the capacity. */
    readonly activeStudentsCount: number = 0,
    readonly course: GroupCourseSummary | null = null,
    readonly teacher: GroupTeacherSummary | null = null,
  ) {}

  /** §6.4.2 — the number the public "N seats left" badge shows. */
  freeSeats(): number {
    return Math.max(0, this.capacity - this.activeStudentsCount);
  }

  isFull(): boolean {
    return this.freeSeats() === 0;
  }

  /** A finished or cancelled intake no longer accepts enrolments. */
  acceptsEnrolment(): boolean {
    return (
      this.status !== GroupStatus.FINISHED &&
      this.status !== GroupStatus.CANCELLED &&
      !this.isFull()
    );
  }

  /**
   * Checks the two orderings a schedule can get wrong.
   *
   * Lives on the entity so create and update enforce the identical rule and a
   * group cannot be edited into a state creation would have rejected.
   * `startTime`/`endTime` are zero-padded `HH:mm`, so string comparison is
   * chronological.
   */
  static validateSchedule(
    startTime: string,
    endTime: string,
    startDate: Date,
    endDate: Date | null,
  ): string | null {
    if (startTime >= endTime) {
      return 'endTime must be later than startTime';
    }

    if (endDate && endDate.getTime() <= startDate.getTime()) {
      return 'endDate must be later than startDate';
    }

    return null;
  }
}

export interface CreateGroupData {
  name: string;
  courseId: string;
  teacherId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  weekDays: WeekDay[];
  startTime: string;
  endTime: string;
  roomName?: string | null;
  capacity?: number;
  status?: GroupStatus;
}

export type UpdateGroupData = Partial<CreateGroupData>;

export interface GroupQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  courseId?: string;
  teacherId?: string;
  status?: GroupStatus;
  /** Public "upcoming" listing: FORMING and starting today or later. */
  upcomingOnly?: boolean;
}
