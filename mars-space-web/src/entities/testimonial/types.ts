import type { Localized } from '@/shared/types/common.types';

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: Localized | null;
  avatarUrl: string | null;
  courseId: string | null;
  rating: number;
  content: Localized;
  videoUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
