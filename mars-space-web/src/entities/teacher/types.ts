import type { Localized } from '@/shared/types/common.types';

export interface TeacherCourseSummary {
  id: string;
  slug: string;
  title: Localized;
  coverImageUrl: string | null;
}

export interface TeacherSocials {
  telegram?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Teacher {
  id: string;
  slug: string;
  fullName: string;
  position: Localized;
  bio: Localized | null;
  photoUrl: string | null;
  experienceYears: number;
  skills: string[];
  socials: TeacherSocials | null;
  sortOrder: number;
  isActive: boolean;
  /** Populated on the teacher detail endpoint. */
  courses?: TeacherCourseSummary[];
  createdAt: string;
  updatedAt: string;
}
