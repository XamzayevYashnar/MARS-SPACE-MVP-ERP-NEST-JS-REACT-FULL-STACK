import { useQuery } from '@tanstack/react-query';
import { http } from './axios-instance';
import { endpoints } from './endpoints';
import { queryKeys } from './query-keys';
import type { StatisticsOverview } from '@/shared/types/statistics.types';

export function useStatisticsOverview() {
  return useQuery({
    queryKey: queryKeys.statistics.overview,
    queryFn: () => http.get<StatisticsOverview>(endpoints.admin.statistics),
    staleTime: 0, // statistics are always fresh (spec §7.4)
  });
}
