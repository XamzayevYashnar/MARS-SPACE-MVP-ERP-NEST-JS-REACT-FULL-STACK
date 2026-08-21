import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { postsResource } from '@/features/admin-crud/resources';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import { useLocalize } from '@/shared/lib/localize';
import { paths } from '@/app/router/paths';
import type { Post } from '@/entities/post/types';

export function AdminNewsPage() {
  const { t } = useTranslation('admin');
  const { t: tl } = useLocalize();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = postsResource.useList();
  const remove = postsResource.useRemove();
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

  const publish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      http.patch(endpoints.admin.postPublish(id), { isPublished }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.posts.all }),
  });

  const columns = useMemo<ColumnDef<Post, unknown>[]>(
    () => [
      { header: t('fields.title'), cell: (c) => <span className="text-ice">{tl(c.row.original.title)}</span> },
      { header: t('fields.tags'), cell: (c) => <span className="font-mono text-xs text-dust">{c.row.original.tags.join(', ')}</span> },
      {
        header: t('table.status'),
        cell: (c) => (
          <Badge variant={c.row.original.isPublished ? 'success' : 'neutral'}>
            {c.row.original.isPublished ? t('table.published') : t('table.draft')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => {
          const post = c.row.original;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => publish.mutate({ id: post.id, isPublished: !post.isPublished })}>
                {post.isPublished ? t('actions.unpublish') : t('actions.publish')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void navigate(paths.admin.newsEdit(post.id))}>{t('actions.edit')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(post)}>{t('actions.delete')}</Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tl],
  );

  return (
    <>
      <Seo title={t('nav.news')} noindex />
      <AdminPageHeader
        title={t('nav.news')}
        action={<Button asChild><Link to={paths.admin.newsNew}>{t('actions.create')}</Link></Button>}
      />
      <DataTable columns={columns} data={list.data?.items} isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (v ? undefined : setDeleteTarget(null))}
        title={t('table.confirmDeleteTitle')}
        description={t('table.confirmDeleteDesc', { name: deleteTarget ? tl(deleteTarget.title) : '' })}
        confirmLabel={t('actions.delete')}
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </>
  );
}
