import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { groupsResource } from '@/features/admin-crud/resources';
import { useLocalize } from '@/shared/lib/localize';
import { formatDate } from '@/shared/lib/formatDate';
import type { Group } from '@/entities/group/types';

export function AdminGroupsPage() {
  const { t } = useTranslation('admin');
  const { t: tl, lang } = useLocalize();
  const list = groupsResource.useList();
  const remove = groupsResource.useRemove();
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const columns = useMemo<ColumnDef<Group, unknown>[]>(
    () => [
      { header: t('fields.name'), cell: (c) => <span className="font-mono text-oxide">{c.row.original.name}</span> },
      { header: t('nav.courses'), cell: (c) => (c.row.original.course ? tl(c.row.original.course.title) : '—') },
      { header: t('fields.startDate'), cell: (c) => <span className="font-mono text-xs">{formatDate(c.row.original.startDate, lang)}</span> },
      {
        header: t('leads.columns.status'),
        cell: (c) => (
          <span className="flex items-center gap-2">
            <Badge variant={c.row.original.freeSeats > 0 ? 'success' : 'alert'}>{c.row.original.freeSeats}/{c.row.original.capacity}</Badge>
            <span className="font-mono text-xs text-dust">{c.row.original.status}</span>
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c.row.original)}>{t('actions.delete')}</Button>
          </div>
        ),
      },
    ],
    [t, tl, lang],
  );

  return (
    <>
      <Seo title={t('nav.groups')} noindex />
      <AdminPageHeader title={t('nav.groups')} />
      <DataTable columns={columns} data={list.data?.items} isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (v ? undefined : setDeleteTarget(null))}
        title={t('table.confirmDeleteTitle')}
        description={t('table.confirmDeleteDesc', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('actions.delete')}
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </>
  );
}
