import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { UpcomingGroup } from './types';

export const groupApi = {
  upcoming: (params: { courseId?: string; limit?: number } = {}) =>
    http.get<UpcomingGroup[]>(endpoints.groupsUpcoming, { params }),
};
