import type { Localized } from '@/shared/types/common.types';

export interface PostAuthorSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  content: Localized;
  coverImageUrl: string | null;
  tags: string[];
  author: PostAuthorSummary | null;
  readMinutes: number;
  viewCount: number;
  metaTitle: Localized | null;
  metaDescription: Localized | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostFilters {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}
