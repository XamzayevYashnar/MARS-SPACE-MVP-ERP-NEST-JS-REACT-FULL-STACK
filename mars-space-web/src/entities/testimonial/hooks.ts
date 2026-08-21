import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { testimonialApi } from './api';

export function useTestimonials(params: { courseId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.testimonials.list(params),
    queryFn: () => testimonialApi.list(params),
    staleTime: STALE_TIME.publicContent,
  });
}
