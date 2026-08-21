import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { postApi } from './api';
import type { PostFilters } from './types';

export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: () => postApi.list(filters),
    staleTime: STALE_TIME.publicContent,
  });
}

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detail(slug ?? ''),
    queryFn: () => postApi.detail(slug as string),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.publicContent,
  });
}
