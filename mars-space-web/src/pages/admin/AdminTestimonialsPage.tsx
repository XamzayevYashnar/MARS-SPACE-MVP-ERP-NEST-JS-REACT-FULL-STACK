import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Badge, Button, FormField, Input, Modal, Textarea } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { LangTabStrip } from '@/features/admin-crud/LangTabStrip';
import { testimonialsResource } from '@/features/admin-crud/resources';
import { useLocalize } from '@/shared/lib/localize';
import { type Language } from '@/shared/config/constants';
import type { Testimonial } from '@/entities/testimonial/types';

const schema = z.object({
  authorName: z.string().min(1, { message: 'validation.required' }),
  authorRole: z.object({ uz: z.string(), ru: z.string(), en: z.string() }),
  content: z.object({
    uz: z.string().min(1, { message: 'validation.required' }),
    ru: z.string(),
    en: z.string(),
  }),
  rating: z.number().min(1).max(5),
  videoUrl: z.string().optional(),
  isPublished: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  authorName: '',
  authorRole: { uz: '', ru: '', en: '' },
  content: { uz: '', ru: '', en: '' },
  rating: 5,
  videoUrl: '',
  isPublished: true,
};

export function AdminTestimonialsPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const list = testimonialsResource.useList();
  const create = testimonialsResource.useCreate();
  const update = testimonialsResource.useUpdate();
  const remove = testimonialsResource.useRemove();

  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [lang, setLang] = useState<Language>('uz');
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  const openCreate = () => {
    setEditing(null);
    setLang('uz');
    form.reset(empty);
    setFormOpen(true);
  };
  const openEdit = (item: Testimonial) => {
    setEditing(item);
    setLang('uz');
    form.reset({
      authorName: item.authorName,
      authorRole: item.authorRole && typeof item.authorRole !== 'string' ? item.authorRole : { uz: '', ru: '', en: '' },
      content: typeof item.content !== 'string' ? item.content : { uz: item.content, ru: '', en: '' },
      rating: item.rating,
      videoUrl: item.videoUrl ?? '',
      isPublished: item.isPublished,
    });
    setFormOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    const onDone = () => {
      toast.success(t('settings.saved'));
      setFormOpen(false);
    };
    if (editing) update.mutate({ id: editing.id, body: values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: onDone });
  });

  const completeness: Record<Language, boolean> = {
    uz: Boolean(form.watch('content.uz')),
    ru: Boolean(form.watch('content.ru')),
    en: Boolean(form.watch('content.en')),
  };

  const columns = useMemo<ColumnDef<Testimonial, unknown>[]>(
    () => [
      { header: t('fields.authorName'), cell: (c) => <span className="text-ice">{c.row.original.authorName}</span> },
      { header: t('fields.content'), cell: (c) => <span className="line-clamp-1 text-dust">{tl(c.row.original.content)}</span> },
      { header: t('fields.rating'), cell: (c) => <span className="font-mono text-sol">{c.row.original.rating}★</span> },
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
        cell: (c) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(c.row.original)}>
              {t('actions.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c.row.original)}>
              {t('actions.delete')}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tl],
  );

  return (
    <>
      <Seo title={t('nav.testimonials')} noindex />
      <AdminPageHeader title={t('nav.testimonials')} action={<Button onClick={openCreate}>{t('actions.create')}</Button>} />

      <DataTable
        columns={columns}
        data={list.data?.items}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => void list.refetch()}
        emptyAction={<Button onClick={openCreate}>{t('actions.create')}</Button>}
      />

      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? t('actions.edit') : t('actions.create')}
        closeLabel={tc('actions.close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button loading={create.isPending || update.isPending} onClick={() => void onSubmit()}>
              {t('actions.save')}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <FormField label={t('fields.authorName')} required error={form.formState.errors.authorName?.message}>
            {(f) => <Input {...f} {...form.register('authorName')} />}
          </FormField>
          <LangTabStrip active={lang} onChange={setLang} completeness={completeness} />
          <FormField label={t('fields.authorRole')}>
            {(f) => <Input {...f} {...form.register(`authorRole.${lang}`)} />}
          </FormField>
          <FormField label={t('fields.content')} required={lang === 'uz'} error={form.formState.errors.content?.uz?.message}>
            {(f) => <Textarea {...f} {...form.register(`content.${lang}`)} rows={4} />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('fields.rating')}>
              {(f) => <Input {...f} type="number" min={1} max={5} {...form.register('rating', { valueAsNumber: true })} />}
            </FormField>
            <FormField label={t('fields.videoUrl')}>{(f) => <Input {...f} {...form.register('videoUrl')} />}</FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-ice">
            <input type="checkbox" {...form.register('isPublished')} className="accent-oxide" />
            {t('fields.isPublished')}
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (v ? undefined : setDeleteTarget(null))}
        title={t('table.confirmDeleteTitle')}
        description={t('table.confirmDeleteDesc', { name: deleteTarget?.authorName ?? '' })}
        confirmLabel={t('actions.delete')}
        loading={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </>
  );
}
