import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button, FormField, Input, Modal, Textarea } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { LangTabStrip } from '@/features/admin-crud/LangTabStrip';
import { ImageUploader } from '@/features/admin-crud/ImageUploader';
import { teachersResource } from '@/features/admin-crud/resources';
import { slugify } from '@/features/admin-crud/slug';
import { useLocalize } from '@/shared/lib/localize';
import { type Language } from '@/shared/config/constants';
import type { Teacher } from '@/entities/teacher/types';

const schema = z.object({
  fullName: z.string().min(1, { message: 'validation.required' }),
  position: z.object({ uz: z.string().min(1, { message: 'validation.required' }), ru: z.string(), en: z.string() }),
  bio: z.object({ uz: z.string(), ru: z.string(), en: z.string() }),
  photoUrl: z.string().nullable(),
  experienceYears: z.number().min(0),
  skills: z.string(),
  slug: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  fullName: '',
  position: { uz: '', ru: '', en: '' },
  bio: { uz: '', ru: '', en: '' },
  photoUrl: null,
  experienceYears: 0,
  skills: '',
  slug: '',
};

export function AdminTeachersPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const list = teachersResource.useList();
  const create = teachersResource.useCreate();
  const update = teachersResource.useUpdate();
  const remove = teachersResource.useRemove();

  const [editing, setEditing] = useState<Teacher | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [lang, setLang] = useState<Language>('uz');
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  const openCreate = () => {
    setEditing(null);
    setLang('uz');
    form.reset(empty);
    setFormOpen(true);
  };
  const openEdit = (item: Teacher) => {
    setEditing(item);
    setLang('uz');
    form.reset({
      fullName: item.fullName,
      position: typeof item.position !== 'string' ? item.position : { uz: item.position, ru: '', en: '' },
      bio: item.bio && typeof item.bio !== 'string' ? item.bio : { uz: '', ru: '', en: '' },
      photoUrl: item.photoUrl,
      experienceYears: item.experienceYears,
      skills: item.skills.join(', '),
      slug: item.slug,
    });
    setFormOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    const body = {
      ...values,
      slug: values.slug || slugify(values.fullName),
      skills: values.skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const onDone = () => {
      toast.success(t('settings.saved'));
      setFormOpen(false);
    };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  });

  const completeness: Record<Language, boolean> = {
    uz: Boolean(form.watch('position.uz')),
    ru: Boolean(form.watch('position.ru')),
    en: Boolean(form.watch('position.en')),
  };

  const columns = useMemo<ColumnDef<Teacher, unknown>[]>(
    () => [
      { header: t('fields.fullName'), cell: (c) => <span className="text-ice">{c.row.original.fullName}</span> },
      { header: t('fields.position'), cell: (c) => <span className="text-dust">{tl(c.row.original.position)}</span> },
      { header: t('fields.experienceYears'), cell: (c) => <span className="font-mono text-xs">{c.row.original.experienceYears}</span> },
      {
        id: 'actions',
        header: '',
        cell: (c) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(c.row.original)}>{t('actions.edit')}</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c.row.original)}>{t('actions.delete')}</Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tl],
  );

  return (
    <>
      <Seo title={t('nav.teachers')} noindex />
      <AdminPageHeader title={t('nav.teachers')} action={<Button onClick={openCreate}>{t('actions.create')}</Button>} />

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
        size="lg"
        closeLabel={tc('actions.close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>{tc('actions.cancel')}</Button>
            <Button loading={create.isPending || update.isPending} onClick={() => void onSubmit()}>{t('actions.save')}</Button>
          </>
        }
      >
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <Controller
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} label={t('form.photo')} />
            )}
          />
          <FormField label={t('fields.fullName')} required error={form.formState.errors.fullName?.message}>
            {(f) => <Input {...f} {...form.register('fullName')} />}
          </FormField>
          <LangTabStrip active={lang} onChange={setLang} completeness={completeness} />
          <FormField label={t('fields.position')} required={lang === 'uz'} error={form.formState.errors.position?.uz?.message}>
            {(f) => <Input {...f} {...form.register(`position.${lang}`)} />}
          </FormField>
          <FormField label={t('fields.bio')}>
            {(f) => <Textarea {...f} {...form.register(`bio.${lang}`)} rows={3} />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('fields.experienceYears')}>
              {(f) => <Input {...f} type="number" {...form.register('experienceYears', { valueAsNumber: true })} />}
            </FormField>
            <FormField label={t('form.slug')}>{(f) => <Input {...f} {...form.register('slug')} />}</FormField>
          </div>
          <FormField label={t('fields.skills')}>
            {(f) => <Input {...f} {...form.register('skills')} placeholder="React, TypeScript" />}
          </FormField>
        </form>
      </Modal>

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
