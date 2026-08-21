import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { Category } from './types';

export const categoryApi = {
  list: () => http.get<Category[]>(endpoints.categories),
};
