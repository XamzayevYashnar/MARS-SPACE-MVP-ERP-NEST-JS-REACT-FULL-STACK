import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { courseApi } from './api';
import type { CourseFilters } from './types';

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => courseApi.list(filters),
    staleTime: STALE_TIME.publicContent,
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: queryKeys.courses.featured(),
    queryFn: () => courseApi.featured(),
    staleTime: STALE_TIME.publicContent,
  });
}

export function useCourse(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug ?? ''),
    queryFn: () => courseApi.detail(slug as string),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.publicContent,
  });
}
