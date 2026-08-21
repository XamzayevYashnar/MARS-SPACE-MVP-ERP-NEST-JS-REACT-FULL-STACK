import { LocalizedText } from '../../../../common/interfaces';

export interface PostAuthorSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export class Post {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly title: LocalizedText,
    readonly excerpt: LocalizedText,
    readonly content: LocalizedText,
    readonly coverImageUrl: string | null,
    readonly tags: string[],
    readonly authorId: string | null,
    readonly readMinutes: number,
    readonly viewCount: number,
    readonly metaTitle: LocalizedText | null,
    readonly metaDescription: LocalizedText | null,
    readonly isPublished: boolean,
    readonly publishedAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly author: PostAuthorSummary | null = null,
  ) {}
}

export interface CreatePostData {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  coverImageUrl?: string | null;
  tags?: string[];
  authorId?: string | null;
  readMinutes?: number;
  metaTitle?: LocalizedText | null;
  metaDescription?: LocalizedText | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
}

export type UpdatePostData = Partial<CreatePostData>;

export interface PostQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  tag?: string;
  isPublished?: boolean;
}
