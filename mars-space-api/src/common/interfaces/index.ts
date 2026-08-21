import { UserRole } from '@prisma/client';
import { Language } from '../enums/language.enum';

/** Every user-facing content field is stored as this JSONB shape (§5.1). */
export interface LocalizedText {
  uz: string;
  ru: string;
  en: string;
}

/** Localised list, used by `outcomes`, `requirements` and syllabus topics. */
export interface LocalizedStringList {
  uz: string[];
  ru: string[];
  en: string[];
}

/** One entry of a course syllabus (§5.3). */
export interface CourseSyllabusModule {
  order: number;
  title: LocalizedText;
  durationWeeks: number;
  topics: LocalizedStringList;
}

/** Pagination block attached to every list response as `meta`. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Repository return type for every paginated query. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Decoded access-token payload (§7). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/** Refresh tokens additionally carry the row id so rotation can revoke it. */
export interface RefreshTokenPayload extends JwtPayload {
  tokenId: string;
}

/** The subset of the user attached to the request by `JwtStrategy`. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Normalised sorting/pagination input shared by every list use case. */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  /** Present only on public endpoints; flattens LocalizedText to a string. */
  lang?: Language;
}
