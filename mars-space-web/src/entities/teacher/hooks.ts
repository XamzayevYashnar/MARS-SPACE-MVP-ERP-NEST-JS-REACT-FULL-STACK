import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { teacherApi } from './api';

export function useTeachers(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.teachers.list(params),
    queryFn: () => teacherApi.list(params),
    staleTime: STALE_TIME.publicContent,
  });
}

export function useTeacher(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teachers.detail(slug ?? ''),
    queryFn: () => teacherApi.detail(slug as string),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.publicContent,
  });
}
