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
import { coursesResource } from '@/features/admin-crud/resources';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import { useLocalize } from '@/shared/lib/localize';
import { formatPrice } from '@/shared/lib/formatPrice';
import { paths } from '@/app/router/paths';
import type { Course } from '@/entities/course/types';

export function AdminCoursesPage() {
  const { t } = useTranslation('admin');
  const { t: tl, lang } = useLocalize();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = coursesResource.useList();
  const remove = coursesResource.useRemove();
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const publish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      http.patch(endpoints.admin.coursePublish(id), { isPublished }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.courses.all }),
  });
  const feature = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      http.patch(endpoints.admin.courseFeature(id), { isFeatured }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.courses.all }),
  });

  const columns = useMemo<ColumnDef<Course, unknown>[]>(
    () => [
      { header: t('fields.title'), cell: (c) => <span className="text-ice">{tl(c.row.original.title)}</span> },
      { header: t('fields.category'), cell: (c) => (c.row.original.category ? tl(c.row.original.category.name) : '—') },
      {
        header: t('fields.price'),
        cell: (c) => <span className="font-mono text-xs text-sol">{formatPrice(c.row.original.price.effectiveAmount, lang, c.row.original.price.currency)}</span>,
      },
      {
        header: t('table.status'),
        cell: (c) => (
          <div className="flex gap-1">
            <Badge variant={c.row.original.isPublished ? 'success' : 'neutral'}>
              {c.row.original.isPublished ? t('table.published') : t('table.draft')}
            </Badge>
            {c.row.original.isFeatured && <Badge variant="oxide">★</Badge>}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => {
          const course = c.row.original;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => publish.mutate({ id: course.id, isPublished: !course.isPublished })}>
                {course.isPublished ? t('actions.unpublish') : t('actions.publish')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => feature.mutate({ id: course.id, isFeatured: !course.isFeatured })}>
                {t('actions.feature')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void navigate(paths.admin.courseEdit(course.id))}>
                {t('actions.edit')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(course)}>
                {t('actions.delete')}
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tl, lang],
  );

  return (
    <>
      <Seo title={t('nav.courses')} noindex />
      <AdminPageHeader
        title={t('nav.courses')}
        action={
          <Button asChild>
            <Link to={paths.admin.courseNew}>{t('actions.create')}</Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={list.data?.items}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
      />

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
