import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Card, CardBody, FormField, Input, Skeleton, Textarea } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { LangTabStrip } from '@/features/admin-crud/LangTabStrip';
import { ImageUploader } from '@/features/admin-crud/ImageUploader';
import { RichTextEditor } from '@/features/admin-crud/RichTextEditor';
import { postsResource } from '@/features/admin-crud/resources';
import { slugify } from '@/features/admin-crud/slug';
import { type Language } from '@/shared/config/constants';
import { paths } from '@/app/router/paths';
import type { Post } from '@/entities/post/types';

const schema = z.object({
  title: z.object({ uz: z.string().min(1, { message: 'validation.required' }), ru: z.string(), en: z.string() }),
  excerpt: z.object({ uz: z.string(), ru: z.string(), en: z.string() }),
  content: z.object({ uz: z.string(), ru: z.string(), en: z.string() }),
  slug: z.string().optional(),
  tags: z.string(),
  coverImageUrl: z.string().nullable(),
  isPublished: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  title: { uz: '', ru: '', en: '' },
  excerpt: { uz: '', ru: '', en: '' },
  content: { uz: '', ru: '', en: '' },
  slug: '',
  tags: '',
  coverImageUrl: null,
  isPublished: false,
};

function toForm(p: Post): FormValues {
  const asLoc = (v: Post['title']) => (typeof v !== 'string' ? v : { uz: v, ru: '', en: '' });
  return {
    title: asLoc(p.title),
    excerpt: asLoc(p.excerpt),
    content: asLoc(p.content),
    slug: p.slug,
    tags: p.tags.join(', '),
    coverImageUrl: p.coverImageUrl,
    isPublished: p.isPublished,
  };
}

export function NewsFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();

  const detail = postsResource.useDetail(id);
  const create = postsResource.useCreate();
  const update = postsResource.useUpdate();

  const [lang, setLang] = useState<Language>('uz');
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  useEffect(() => {
    if (detail.data) form.reset(toForm(detail.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data]);

  const onSubmit = form.handleSubmit((values) => {
    const body = {
      ...values,
      slug: values.slug || slugify(values.title.uz),
      tags: values.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const onDone = () => {
      toast.success(t('settings.saved'));
      void navigate(paths.admin.news);
    };
    if (isEdit && id) update.mutate({ id, body }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  });

  const completeness: Record<Language, boolean> = {
    uz: Boolean(form.watch('title.uz')),
    ru: Boolean(form.watch('title.ru')),
    en: Boolean(form.watch('title.en')),
  };

  if (isEdit && detail.isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <Seo title={isEdit ? t('actions.edit') : t('actions.create')} noindex />
      <AdminPageHeader
        title={isEdit ? t('actions.edit') : t('actions.create')}
        action={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => void navigate(paths.admin.news)}>{tc('actions.cancel')}</Button>
            <Button loading={create.isPending || update.isPending} onClick={() => void onSubmit()}>{t('actions.save')}</Button>
          </div>
        }
      />

      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="space-y-4">
            <LangTabStrip active={lang} onChange={setLang} completeness={completeness} />
            <FormField label={t('fields.title')} required={lang === 'uz'} error={form.formState.errors.title?.uz?.message}>
              {(f) => <Input {...f} {...form.register(`title.${lang}`)} />}
            </FormField>
            <FormField label={t('fields.excerpt')}>
              {(f) => <Textarea {...f} {...form.register(`excerpt.${lang}`)} rows={2} />}
            </FormField>
            <FormField label={t('fields.content')}>
              {() => (
                <Controller
                  control={form.control}
                  name={`content.${lang}` as const}
                  render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
                />
              )}
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <Controller
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} label={t('form.cover')} />}
            />
            <FormField label={t('fields.tags')}>{(f) => <Input {...f} {...form.register('tags')} placeholder="qabul, yangiliklar" />}</FormField>
            <FormField label={t('form.slug')}>{(f) => <Input {...f} {...form.register('slug')} />}</FormField>
            <label className="flex items-center gap-2 text-sm text-ice">
              <input type="checkbox" {...form.register('isPublished')} className="accent-oxide" /> {t('fields.isPublished')}
            </label>
          </CardBody>
        </Card>
      </form>
    </>
  );
}
