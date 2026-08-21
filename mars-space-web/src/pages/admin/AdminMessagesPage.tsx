import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button, Drawer } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { messagesResource, type AdminMessage } from '@/features/admin-crud/resources';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import { formatDate } from '@/shared/lib/formatDate';
import { formatPhone } from '@/shared/lib/formatPhone';
import { useLocalize } from '@/shared/lib/localize';

export function AdminMessagesPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { lang } = useLocalize();
  const qc = useQueryClient();
  const list = messagesResource.useList();
  const remove = messagesResource.useRemove();
  const [open, setOpen] = useState<AdminMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMessage | null>(null);

  const markRead = useMutation({
    mutationFn: (id: string) => http.patch(endpoints.admin.messageRead(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.messages.all }),
  });

  const openMessage = (msg: AdminMessage) => {
    setOpen(msg);
    if (!msg.isRead) markRead.mutate(msg.id);
  };

  const columns = useMemo<ColumnDef<AdminMessage, unknown>[]>(
    () => [
      {
        header: t('messages.from'),
        cell: (c) => (
          <span className="flex items-center gap-2">
            {!c.row.original.isRead && <span className="h-2 w-2 rounded-full bg-oxide" aria-label="unread" />}
            <span className="text-ice">{c.row.original.fullName}</span>
          </span>
        ),
      },
      { header: t('messages.subject'), cell: (c) => c.row.original.subject ?? '—' },
      { header: t('fields.phone'), cell: (c) => <span className="font-mono text-xs">{formatPhone(c.row.original.phone)}</span> },
      { header: t('messages.date'), cell: (c) => <span className="font-mono text-xs text-dust">{formatDate(c.row.original.createdAt, lang)}</span> },
      {
        id: 'actions',
        header: '',
        cell: (c) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openMessage(c.row.original)}>
              {tc('actions.details')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c.row.original)}>
              {t('actions.delete')}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc, lang],
  );

  return (
    <>
      <Seo title={t('messages.title')} noindex />
      <AdminPageHeader title={t('messages.title')} />

      <DataTable
        columns={columns}
        data={list.data?.items}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
      />

      <Drawer
        open={Boolean(open)}
        onOpenChange={(v) => (v ? undefined : setOpen(null))}
        title={open?.fullName ?? ''}
        description={open?.subject ?? undefined}
        closeLabel={tc('actions.close')}
      >
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{formatPhone(open.phone)}</Badge>
              {open.email && <Badge>{open.email}</Badge>}
            </div>
            <p className="whitespace-pre-wrap rounded-sm bg-basalt-raised p-4 text-sm text-ice">{open.message}</p>
          </div>
        )}
      </Drawer>

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
