import { LocalizedText } from '../../../../common/interfaces';

export class Category {
  constructor(
    readonly id: string,
    readonly slug: string,
    readonly name: LocalizedText,
    readonly description: LocalizedText | null,
    readonly iconKey: string | null,
    readonly colorHex: string | null,
    readonly sortOrder: number,
    readonly isActive: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    /** Published courses in this category; only populated by list queries. */
    readonly coursesCount: number = 0,
  ) {}
}

export interface CreateCategoryData {
  slug: string;
  name: LocalizedText;
  description?: LocalizedText | null;
  iconKey?: string | null;
  colorHex?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  slug?: string;
  name?: LocalizedText;
  description?: LocalizedText | null;
  iconKey?: string | null;
  colorHex?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  /** Public listings count only published courses. */
  publishedCoursesOnly: boolean;
}
