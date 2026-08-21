import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { categoryApi } from './api';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryApi.list(),
    staleTime: STALE_TIME.publicContent,
  });
}
