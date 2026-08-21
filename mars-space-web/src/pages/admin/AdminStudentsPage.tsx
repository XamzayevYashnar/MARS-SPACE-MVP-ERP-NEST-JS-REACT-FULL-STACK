import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { studentsResource } from '@/features/admin-crud/resources';
import { formatPhone } from '@/shared/lib/formatPhone';
import type { Student } from '@/entities/student/types';

export function AdminStudentsPage() {
  const { t } = useTranslation('admin');
  const list = studentsResource.useList();
  const remove = studentsResource.useRemove();
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const columns = useMemo<ColumnDef<Student, unknown>[]>(
    () => [
      { header: t('fields.fullName'), cell: (c) => <span className="text-ice">{c.row.original.fullName}</span> },
      { header: t('fields.phone'), cell: (c) => <span className="font-mono text-xs">{formatPhone(c.row.original.phone)}</span> },
      { header: t('fields.group'), cell: (c) => c.row.original.group?.name ?? '—' },
      { header: t('leads.columns.status'), cell: (c) => <Badge>{c.row.original.status}</Badge> },
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
    [t],
  );

  return (
    <>
      <Seo title={t('nav.students')} noindex />
      <AdminPageHeader title={t('nav.students')} />
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
