import type {
  CourseFormat,
  CourseLevel,
  CoursePrice,
  CourseSyllabusModule,
  GroupStatus,
  Localized,
  LocalizedList,
  WeekDay,
} from '@/shared/types/common.types';

export interface CourseCategorySummary {
  id: string;
  slug: string;
  name: Localized;
  colorHex: string | null;
  iconKey: string | null;
}

export interface CourseTeacherSummary {
  id: string;
  slug: string;
  fullName: string;
  position: Localized;
  photoUrl: string | null;
}

/** An open intake shown on a course page / sticky enrolment card. */
export interface CourseGroupSummary {
  id: string;
  name: string;
  startDate: string;
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
  authorRole: Localized | null;
  avatarUrl: string | null;
  rating: number;
  content: Localized;
}

export interface Course {
  id: string;
  slug: string;
  title: Localized;
  shortDescription: Localized;
  description: Localized;
  outcomes: LocalizedList | null;
  requirements: LocalizedList | null;
  syllabus: CourseSyllabusModule[] | null;
  categoryId: string;
  category: CourseCategorySummary | null;
  level: CourseLevel;
  format: CourseFormat;
  durationMonths: number;
  lessonsPerWeek: number;
  lessonMinutes: number;
  totalLessons: number;
  price: CoursePrice;
  coverImageUrl: string | null;
  promoVideoUrl: string | null;
  metaTitle: Localized | null;
  metaDescription: Localized | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  teachers: CourseTeacherSummary[];
  groups: CourseGroupSummary[];
  testimonials: CourseTestimonialSummary[];
  createdAt: string;
  updatedAt: string;
}

/** Structural subset a CourseCard needs — list and detail both satisfy it. */
export type CourseCardData = Pick<
  Course,
  | 'id'
  | 'slug'
  | 'title'
  | 'shortDescription'
  | 'level'
  | 'format'
  | 'durationMonths'
  | 'lessonsPerWeek'
  | 'totalLessons'
  | 'price'
  | 'coverImageUrl'
  | 'isFeatured'
  | 'category'
  | 'teachers'
>;

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  level?: CourseLevel;
  format?: CourseFormat;
  minPrice?: number;
  maxPrice?: number;
}
