import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button, FormField, Input, Modal } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { DataTable } from '@/features/admin-crud/DataTable';
import { ConfirmDialog } from '@/features/admin-crud/ConfirmDialog';
import { LangTabStrip } from '@/features/admin-crud/LangTabStrip';
import { categoriesResource } from '@/features/admin-crud/resources';
import { slugify } from '@/features/admin-crud/slug';
import { useLocalize } from '@/shared/lib/localize';
import { type Language } from '@/shared/config/constants';
import type { Category } from '@/entities/category/types';

const schema = z.object({
  name: z.object({
    uz: z.string().min(1, { message: 'validation.required' }),
    ru: z.string(),
    en: z.string(),
  }),
  description: z.object({ uz: z.string(), ru: z.string(), en: z.string() }),
  slug: z.string().optional(),
  iconKey: z.string().optional(),
  colorHex: z.string().optional(),
  sortOrder: z.number(),
});
type FormValues = z.infer<typeof schema>;

export function AdminCategoriesPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const list = categoriesResource.useList();
  const create = categoriesResource.useCreate();
  const update = categoriesResource.useUpdate();
  const remove = categoriesResource.useRemove();

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [lang, setLang] = useState<Language>('uz');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: { uz: '', ru: '', en: '' }, description: { uz: '', ru: '', en: '' }, sortOrder: 0 },
  });

  const openCreate = () => {
    setEditing(null);
    setLang('uz');
    form.reset({ name: { uz: '', ru: '', en: '' }, description: { uz: '', ru: '', en: '' }, sortOrder: 0 });
    setFormOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setLang('uz');
    form.reset({
      name: typeof cat.name === 'string' ? { uz: cat.name, ru: '', en: '' } : cat.name,
      description:
        cat.description && typeof cat.description !== 'string'
          ? cat.description
          : { uz: '', ru: '', en: '' },
      slug: cat.slug,
      iconKey: cat.iconKey ?? '',
      colorHex: cat.colorHex ?? '',
      sortOrder: cat.sortOrder,
    });
    setFormOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    const body = { ...values, slug: values.slug || slugify(values.name.uz) };
    const onDone = () => {
      toast.success(t('settings.saved'));
      setFormOpen(false);
    };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  });

  const completeness: Record<Language, boolean> = {
    uz: Boolean(form.watch('name.uz')),
    ru: Boolean(form.watch('name.ru')),
    en: Boolean(form.watch('name.en')),
  };

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      { header: t('fields.name'), cell: (c) => <span className="text-ice">{tl(c.row.original.name)}</span> },
      { header: t('form.slug'), cell: (c) => <span className="font-mono text-xs text-dust">{c.row.original.slug}</span> },
      { header: t('fields.sortOrder'), cell: (c) => <span className="font-mono text-xs">{c.row.original.sortOrder}</span> },
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
      <Seo title={t('nav.categories')} noindex />
      <AdminPageHeader
        title={t('nav.categories')}
        action={<Button onClick={openCreate}>{t('actions.create')}</Button>}
      />

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
          <LangTabStrip active={lang} onChange={setLang} completeness={completeness} />
          <FormField label={t('fields.name')} required={lang === 'uz'} error={form.formState.errors.name?.uz?.message}>
            {(f) => <Input {...f} {...form.register(`name.${lang}`)} />}
          </FormField>
          <FormField label={t('fields.description')}>
            {(f) => <Input {...f} {...form.register(`description.${lang}`)} />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('fields.iconKey')}>{(f) => <Input {...f} {...form.register('iconKey')} placeholder="code" />}</FormField>
            <FormField label={t('fields.colorHex')}>{(f) => <Input {...f} {...form.register('colorHex')} placeholder="#C1440E" />}</FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('form.slug')}>{(f) => <Input {...f} {...form.register('slug')} placeholder="frontend" />}</FormField>
            <FormField label={t('fields.sortOrder')}>{(f) => <Input {...f} type="number" {...form.register('sortOrder', { valueAsNumber: true })} />}</FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (v ? undefined : setDeleteTarget(null))}
        title={t('table.confirmDeleteTitle')}
        description={t('table.confirmDeleteDesc', { name: deleteTarget ? tl(deleteTarget.name) : '' })}
        confirmLabel={t('actions.delete')}
        loading={remove.isPending}
        onConfirm={() =>
          deleteTarget &&
          remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </>
  );
}
