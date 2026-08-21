import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { usersResource, type AdminUser } from '@/features/admin-crud/resources';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const qc = useQueryClient();
  const list = usersResource.useList();
  const remove = usersResource.useRemove();
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      http.patch(endpoints.admin.userStatus(id), { isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
  });

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      { header: t('fields.fullName'), cell: (c) => <span className="text-ice">{c.row.original.fullName}</span> },
      { header: t('fields.email'), cell: (c) => <span className="text-dust">{c.row.original.email}</span> },
      { header: t('fields.role'), cell: (c) => <Badge variant="oxide">{c.row.original.role}</Badge> },
      {
        header: t('fields.isActive'),
        cell: (c) => (
          <Badge variant={c.row.original.isActive ? 'success' : 'neutral'}>
            {c.row.original.isActive ? '●' : '○'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => toggle.mutate({ id: c.row.original.id, isActive: !c.row.original.isActive })}>
              {c.row.original.isActive ? t('actions.unpublish') : t('actions.publish')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c.row.original)}>{t('actions.delete')}</Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <>
      <Seo title={t('nav.users')} noindex />
      <AdminPageHeader title={t('nav.users')} />
      <DataTable columns={columns} data={list.data?.items} isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (v ? undefined : setDeleteTarget(null))}
        title={t('table.confirmDeleteTitle')}
        description={t('table.confirmDeleteDesc', { name: deleteTarget?.fullName ?? '' })}
        confirmLabel={t('actions.delete')}
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </>
  );
}
