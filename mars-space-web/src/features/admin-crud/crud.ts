import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/shared/api/axios-instance';
import type { AdminKeySet } from '@/shared/api/query-keys';
import type { Page } from '@/shared/types/api.types';
import { STALE_TIME } from '@/shared/config/constants';
import { getApiErrorMessage } from '@/shared/lib/apiError';

export interface CrudConfig {
  listUrl: string;
  itemUrl: (id: string) => string;
  keys: AdminKeySet;
}

/** Build typed list/get/create/update/remove fetchers for an admin resource. */
export function createCrudApi<T, TCreate, TUpdate = Partial<TCreate>>(cfg: CrudConfig) {
  return {
    list: (params: Record<string, unknown> = {}) => http.getPage<T>(cfg.listUrl, { params }),
    get: (id: string) => http.get<T>(cfg.itemUrl(id)),
    create: (body: TCreate) => http.post<T>(cfg.listUrl, body),
    update: (id: string, body: TUpdate) => http.patch<T>(cfg.itemUrl(id), body),
    remove: (id: string) => http.delete<void>(cfg.itemUrl(id)),
  };
}

export type CrudApi<T, TCreate, TUpdate = Partial<TCreate>> = ReturnType<
  typeof createCrudApi<T, TCreate, TUpdate>
>;

/** Build the standard admin hooks (list/detail/create/update/remove). */
export function createCrudHooks<T, TCreate, TUpdate = Partial<TCreate>>(
  cfg: CrudConfig,
  api: CrudApi<T, TCreate, TUpdate>,
) {
  function useList(filters: Record<string, unknown> = {}) {
    return useQuery<Page<T>>({
      queryKey: cfg.keys.list(filters),
      queryFn: () => api.list(filters),
      staleTime: STALE_TIME.adminList,
    });
  }

  function useDetail(id: string | undefined) {
    return useQuery<T>({
      queryKey: cfg.keys.detail(id ?? ''),
      queryFn: () => api.get(id as string),
      enabled: Boolean(id),
    });
  }

  function useInvalidate() {
    const qc = useQueryClient();
    return () => void qc.invalidateQueries({ queryKey: cfg.keys.all });
  }

  function useCreate() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (body: TCreate) => api.create(body),
      onSuccess: invalidate,
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  function useUpdate() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: TUpdate }) => api.update(id, body),
      onSuccess: invalidate,
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  function useRemove() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: invalidate,
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useRemove, useInvalidate };
}
