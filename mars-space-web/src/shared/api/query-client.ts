import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/types/api.types';

/**
 * Shared QueryClient. staleTime defaults to public-content (5 min); admin and
 * statistics hooks override per spec §7.4. 4xx errors are not retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
