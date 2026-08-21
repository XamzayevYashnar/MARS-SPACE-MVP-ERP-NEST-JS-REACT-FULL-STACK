import { LocalizedText } from '../../../../common/interfaces';

export interface TeacherSocials {
  telegram?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
}

/** Course summary attached to a teacher detail response. */
export interface TeacherCourseSummary {
  id: string;
  slug: string;
  title: LocalizedText;
  coverImageUrl: string | null;
}

export class Teacher {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly fullName: string,
    readonly position: LocalizedText,
    readonly bio: LocalizedText | null,
    readonly photoUrl: string | null,
    readonly experienceYears: number,
    readonly skills: string[],
    readonly socials: TeacherSocials | null,
    readonly sortOrder: number,
    readonly isActive: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    /** Published courses; populated only by the detail query. */
    readonly courses: TeacherCourseSummary[] = [],
  ) {}
}

export interface CreateTeacherData {
  slug: string;
  fullName: string;
  position: LocalizedText;
  bio?: LocalizedText | null;
  photoUrl?: string | null;
  experienceYears?: number;
  skills?: string[];
  socials?: TeacherSocials | null;
  sortOrder?: number;
  isActive?: boolean;
  courseIds?: string[];
}

export interface UpdateTeacherData extends Partial<Omit<CreateTeacherData, 'slug'>> {
  slug?: string;
}

export interface TeacherQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  courseId?: string;
}
