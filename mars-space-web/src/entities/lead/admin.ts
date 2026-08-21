import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import type { Page } from '@/shared/types/api.types';
import type { LeadStatus } from '@/shared/types/common.types';
import type { Lead } from './types';

export interface AdminLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: string;
  courseId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function cleanParams(filters: AdminLeadFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') out[k] = v as string | number;
  }
  return out;
}

export const adminLeadApi = {
  list: (filters: AdminLeadFilters = {}) =>
    http.getPage<Lead>(endpoints.admin.leads, { params: cleanParams(filters) }),
  get: (id: string) => http.get<Lead>(endpoints.admin.lead(id)),
  setStatus: (id: string, status: LeadStatus) =>
    http.patch<Lead>(endpoints.admin.leadStatus(id), { status }),
  assign: (id: string, assignedToId: string | null) =>
    http.patch<Lead>(endpoints.admin.leadAssign(id), { assignedToId }),
  setNote: (id: string, note: string) => http.patch<Lead>(endpoints.admin.leadNote(id), { note }),
  convert: (id: string, body: { groupId: string; note?: string }) =>
    http.post<{ lead: Lead; studentId: string }>(endpoints.admin.leadConvert(id), body),
  remove: (id: string) => http.delete<void>(endpoints.admin.lead(id)),
};

export function useAdminLeads(filters: AdminLeadFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.leads.list(filters),
    queryFn: () => adminLeadApi.list(filters),
    staleTime: STALE_TIME.adminList,
  });
}

export function useAdminLead(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.leads.detail(id ?? ''),
    queryFn: () => adminLeadApi.get(id as string),
    enabled: Boolean(id),
  });
}

/** Optimistic status change with rollback on error (spec §7.4). */
export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      adminLeadApi.setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.admin.leads.all });
      const snapshots = qc.getQueriesData<Page<Lead>>({ queryKey: queryKeys.admin.leads.all });
      for (const [key, page] of snapshots) {
        if (!page) continue;
        qc.setQueryData<Page<Lead>>(key, {
          ...page,
          items: page.items.map((l) => (l.id === id ? { ...l, status } : l)),
        });
      }
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(getApiErrorMessage(error));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all }),
  });
}

export function useAssignLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string | null }) =>
      adminLeadApi.assign(id, assignedToId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminLeadApi.setNote(id, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, groupId, note }: { id: string; groupId: string; note?: string }) =>
      adminLeadApi.convert(id, { groupId, note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.students.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLeadApi.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.leads.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
