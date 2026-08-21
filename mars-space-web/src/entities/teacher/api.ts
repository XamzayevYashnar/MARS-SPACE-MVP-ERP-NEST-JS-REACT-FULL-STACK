import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { Page } from '@/shared/types/api.types';
import type { Teacher } from './types';

export const teacherApi = {
  list: (params: { page?: number; limit?: number } = {}) =>
    http.getPage<Teacher>(endpoints.teachers, { params }),
  detail: (slug: string) => http.get<Teacher>(endpoints.teacher(slug)),
};

export type { Page };
