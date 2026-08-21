import type { StudentStatus } from '@/shared/types/common.types';

export interface StudentGroupSummary {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  groupId: string | null;
  group: StudentGroupSummary | null;
  status: StudentStatus;
  note: string | null;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}
