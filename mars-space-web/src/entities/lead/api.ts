import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { CreateLeadInput, Lead } from './types';

export const leadApi = {
  create: (input: CreateLeadInput) => http.post<Lead>(endpoints.leads, input),
};
