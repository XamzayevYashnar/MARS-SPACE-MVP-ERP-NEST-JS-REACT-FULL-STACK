import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { Page } from '@/shared/types/api.types';
import type { Course, CourseFilters } from './types';

/** Drop undefined values so query strings stay clean. */
function toParams(filters: CourseFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') out[key] = value as string | number;
  }
  return out;
}

export const courseApi = {
  list: (filters: CourseFilters = {}) =>
    http.getPage<Course>(endpoints.courses, { params: toParams(filters) }),
  featured: () => http.get<Course[]>(endpoints.coursesFeatured),
  detail: (slug: string) => http.get<Course>(endpoints.course(slug)),
};

export type { Page };
