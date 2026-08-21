import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { Testimonial } from './types';

export const testimonialApi = {
  list: (params: { courseId?: string } = {}) =>
    http.get<Testimonial[]>(endpoints.testimonials, { params }),
};
