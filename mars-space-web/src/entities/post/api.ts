import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { Page } from '@/shared/types/api.types';
import type { Post, PostFilters } from './types';

function toParams(filters: PostFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') out[key] = value as string | number;
  }
  return out;
}

export const postApi = {
  list: (filters: PostFilters = {}) =>
    http.getPage<Post>(endpoints.posts, { params: toParams(filters) }),
  detail: (slug: string) => http.get<Post>(endpoints.post(slug)),
};

export type { Page };
