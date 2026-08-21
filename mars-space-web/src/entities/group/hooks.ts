import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { groupApi } from './api';

export function useUpcomingGroups(params: { courseId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.groups.upcoming(params.courseId),
    queryFn: () => groupApi.upcoming(params),
    // Seat counts change; keep it fresher than static content.
    staleTime: 60 * 1000,
  });
}
