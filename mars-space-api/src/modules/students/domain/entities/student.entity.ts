import { StudentStatus } from '@prisma/client';
import { LocalizedText } from '../../../../common/interfaces';

export interface StudentGroupSummary {
  id: string;
  name: string;
  courseId: string;
  courseTitle: LocalizedText;
}

export class Student {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly phone: string,
    readonly email: string | null,
    readonly birthDate: Date | null,
    readonly groupId: string | null,
    readonly status: StudentStatus,
    readonly note: string | null,
    readonly enrolledAt: Date,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly group: StudentGroupSummary | null = null,
  ) {}

  /** Only an ACTIVE student occupies a seat in the group capacity (§6.4.2). */
  occupiesSeat(): boolean {
    return this.status === StudentStatus.ACTIVE;
  }
}

export interface CreateStudentData {
  fullName: string;
  phone: string;
  email?: string | null;
  birthDate?: Date | null;
  groupId?: string | null;
  status?: StudentStatus;
  note?: string | null;
  enrolledAt?: Date;
}

export type UpdateStudentData = Partial<CreateStudentData>;

export interface StudentQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  groupId?: string;
  courseId?: string;
  status?: StudentStatus;
}
