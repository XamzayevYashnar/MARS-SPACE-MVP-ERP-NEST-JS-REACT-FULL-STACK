import type { Localized } from '@/shared/types/common.types';

export interface Category {
  id: string;
  slug: string;
  name: Localized;
  description: Localized | null;
  iconKey: string | null;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Number of published courses in this category (for the Directions section). */
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}
