import { LocalizedText } from '../../../../common/interfaces';

export interface TestimonialCourseSummary {
  id: string;
  slug: string;
  title: LocalizedText;
}

export class Testimonial {
  constructor(
    readonly id: string,
    readonly authorName: string,
    readonly authorRole: LocalizedText | null,
    readonly avatarUrl: string | null,
    readonly courseId: string | null,
    readonly rating: number,
    readonly content: LocalizedText,
    readonly videoUrl: string | null,
    readonly isPublished: boolean,
    readonly sortOrder: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly course: TestimonialCourseSummary | null = null,
  ) {}
}

export interface CreateTestimonialData {
  authorName: string;
  authorRole?: LocalizedText | null;
  avatarUrl?: string | null;
  courseId?: string | null;
  rating?: number;
  content: LocalizedText;
  videoUrl?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export type UpdateTestimonialData = Partial<CreateTestimonialData>;

export interface TestimonialQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  courseId?: string;
  courseSlug?: string;
  isPublished?: boolean;
  minRating?: number;
}
