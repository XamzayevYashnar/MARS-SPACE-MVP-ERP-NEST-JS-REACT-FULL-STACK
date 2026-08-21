import { CourseFormat, CourseLevel, GroupStatus, WeekDay } from '@prisma/client';
import {
  CourseSyllabusModule,
  LocalizedStringList,
  LocalizedText,
} from '../../../../common/interfaces';
import { CoursePrice } from '../value-objects/course-price.vo';

export interface CourseCategorySummary {
  id: string;
  slug: string;
  name: LocalizedText;
  colorHex: string | null;
  iconKey: string | null;
}

export interface CourseTeacherSummary {
  id: string;
  slug: string;
  fullName: string;
  position: LocalizedText;
  photoUrl: string | null;
}

/** An intake shown on the public course page. */
export interface CourseGroupSummary {
  id: string;
  name: string;
  startDate: Date;
  weekDays: WeekDay[];
  startTime: string;
  endTime: string;
  status: GroupStatus;
  capacity: number;
  freeSeats: number;
}

export interface CourseTestimonialSummary {
  id: string;
  authorName: string;
  authorRole: LocalizedText | null;
  avatarUrl: string | null;
  rating: number;
  content: LocalizedText;
}

export class Course {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly title: LocalizedText,
    readonly shortDescription: LocalizedText,
    readonly description: LocalizedText,
    readonly outcomes: LocalizedStringList | null,
    readonly requirements: LocalizedStringList | null,
    readonly syllabus: CourseSyllabusModule[] | null,
    readonly categoryId: string,
    readonly level: CourseLevel,
    readonly format: CourseFormat,
    readonly durationMonths: number,
    readonly lessonsPerWeek: number,
    readonly lessonMinutes: number,
    readonly price: CoursePrice,
    readonly coverImageUrl: string | null,
    readonly promoVideoUrl: string | null,
    readonly metaTitle: LocalizedText | null,
    readonly metaDescription: LocalizedText | null,
    readonly isFeatured: boolean,
    readonly isPublished: boolean,
    readonly sortOrder: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly category: CourseCategorySummary | null = null,
    readonly teachers: CourseTeacherSummary[] = [],
    readonly groups: CourseGroupSummary[] = [],
    readonly testimonials: CourseTestimonialSummary[] = [],
  ) {}

  /** Total contact hours, derived rather than stored so it cannot drift. */
  totalLessons(): number {
    return Math.round(this.durationMonths * 4.33 * this.lessonsPerWeek);
  }
}

export interface CreateCourseData {
  slug: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  outcomes?: LocalizedStringList | null;
  requirements?: LocalizedStringList | null;
  syllabus?: CourseSyllabusModule[] | null;
  categoryId: string;
  level: CourseLevel;
  format: CourseFormat;
  durationMonths: number;
  lessonsPerWeek: number;
  lessonMinutes?: number;
  price: number;
  discountPrice?: number | null;
  currency?: string;
  coverImageUrl?: string | null;
  promoVideoUrl?: string | null;
  metaTitle?: LocalizedText | null;
  metaDescription?: LocalizedText | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  teacherIds?: string[];
}

export type UpdateCourseData = Partial<CreateCourseData>;

export interface CourseQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  level?: CourseLevel;
  format?: CourseFormat;
  isFeatured?: boolean;
  isPublished?: boolean;
  minPrice?: number;
  maxPrice?: number;
  teacherId?: string;
}
