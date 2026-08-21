import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Card, CardBody, FormField, Input, Modal, Select, Skeleton, Textarea } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { LangTabStrip } from '@/features/admin-crud/LangTabStrip';
import { ImageUploader } from '@/features/admin-crud/ImageUploader';
import { RichTextEditor } from '@/features/admin-crud/RichTextEditor';
import { useUnsavedGuard } from '@/features/admin-crud/useUnsavedGuard';
import { coursesResource, categoriesResource } from '@/features/admin-crud/resources';
import { slugify } from '@/features/admin-crud/slug';
import { useLocalize } from '@/shared/lib/localize';
import { COURSE_FORMATS, COURSE_LEVELS } from '@/shared/types/common.types';
import { type Language } from '@/shared/config/constants';
import { paths } from '@/app/router/paths';
import type { Course } from '@/entities/course/types';

const loc = z.object({ uz: z.string(), ru: z.string(), en: z.string() });
const schema = z.object({
  title: z.object({ uz: z.string().min(1, { message: 'validation.required' }), ru: z.string(), en: z.string() }),
  shortDescription: z.object({ uz: z.string().min(1, { message: 'validation.required' }), ru: z.string(), en: z.string() }),
  description: loc,
  categoryId: z.string().min(1, { message: 'validation.required' }),
  slug: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  format: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']),
  durationMonths: z.number().min(1),
  lessonsPerWeek: z.number().min(1),
  lessonMinutes: z.number().min(30),
  price: z.number().min(0),
  discountPrice: z.number().optional(),
  coverImageUrl: z.string().nullable(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  title: { uz: '', ru: '', en: '' },
  shortDescription: { uz: '', ru: '', en: '' },
  description: { uz: '', ru: '', en: '' },
  categoryId: '',
  slug: '',
  level: 'BEGINNER',
  format: 'OFFLINE',
  durationMonths: 6,
  lessonsPerWeek: 3,
  lessonMinutes: 90,
  price: 0,
  discountPrice: undefined,
  coverImageUrl: null,
  isFeatured: false,
  isPublished: false,
};

function toForm(c: Course): FormValues {
  const asLoc = (v: Course['title']) => (typeof v !== 'string' ? v : { uz: v, ru: '', en: '' });
  return {
    title: asLoc(c.title),
    shortDescription: asLoc(c.shortDescription),
    description: asLoc(c.description),
    categoryId: c.categoryId,
    slug: c.slug,
    level: c.level,
    format: c.format,
    durationMonths: c.durationMonths,
    lessonsPerWeek: c.lessonsPerWeek,
    lessonMinutes: c.lessonMinutes,
    price: c.price.amount,
    discountPrice: c.price.discountAmount ?? undefined,
    coverImageUrl: c.coverImageUrl,
    isFeatured: c.isFeatured,
    isPublished: c.isPublished,
  };
}

export function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const navigate = useNavigate();

  const detail = coursesResource.useDetail(id);
  const categories = categoriesResource.useList();
  const create = coursesResource.useCreate();
  const update = coursesResource.useUpdate();

  const [lang, setLang] = useState<Language>('uz');
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });
  const {
    formState: { isDirty },
    reset,
  } = form;

  useEffect(() => {
    if (detail.data) reset(toForm(detail.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data]);

  const { blocker, allow } = useUnsavedGuard(isDirty);

  const onSubmit = form.handleSubmit((values) => {
    const body = { ...values, slug: values.slug || slugify(values.title.uz) };
    const onDone = () => {
      toast.success(t('settings.saved'));
      allow(); // let this post-save navigation through the unsaved guard
      void navigate(paths.admin.courses);
    };
    if (isEdit && id) update.mutate({ id, body }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  });

  const completeness: Record<Language, boolean> = {
    uz: Boolean(form.watch('title.uz')),
    ru: Boolean(form.watch('title.ru')),
    en: Boolean(form.watch('title.en')),
  };

  if (isEdit && detail.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const categoryOptions = categories.data?.items.map((c) => ({ value: c.id, label: tl(c.name) })) ?? [];

  return (
    <>
      <Seo title={isEdit ? t('actions.edit') : t('actions.create')} noindex />
      <AdminPageHeader
        title={isEdit ? t('actions.edit') : t('actions.create')}
        action={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => void navigate(paths.admin.courses)}>
              {tc('actions.cancel')}
            </Button>
            <Button loading={create.isPending || update.isPending} onClick={() => void onSubmit()}>
              {t('actions.save')}
            </Button>
          </div>
        }
      />

      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <LangTabStrip active={lang} onChange={setLang} completeness={completeness} />
              <FormField label={t('fields.title')} required={lang === 'uz'} error={form.formState.errors.title?.uz?.message}>
                {(f) => <Input {...f} {...form.register(`title.${lang}`)} />}
              </FormField>
              <FormField label={t('fields.shortDescription')} required={lang === 'uz'} error={form.formState.errors.shortDescription?.uz?.message}>
                {(f) => <Textarea {...f} {...form.register(`shortDescription.${lang}`)} rows={2} />}
              </FormField>
              <FormField label={t('fields.description')}>
                {() => (
                  <Controller
                    control={form.control}
                    name={`description.${lang}` as const}
                    render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
                  />
                )}
              </FormField>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <Controller
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <ImageUploader value={field.value} onChange={field.onChange} label={t('form.cover')} />
                )}
              />
              <FormField label={t('fields.category')} required error={form.formState.errors.categoryId?.message}>
                {(f) => (
                  <Controller
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select id={f.id} value={field.value} onValueChange={field.onChange} options={categoryOptions} />
                    )}
                  />
                )}
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('fields.level')}>
                  {(f) => (
                    <Controller
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <Select id={f.id} value={field.value} onValueChange={field.onChange}
                          options={COURSE_LEVELS.map((l) => ({ value: l, label: tc(`course.level.${l}`) }))} />
                      )}
                    />
                  )}
                </FormField>
                <FormField label={t('fields.format')}>
                  {(f) => (
                    <Controller
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <Select id={f.id} value={field.value} onValueChange={field.onChange}
                          options={COURSE_FORMATS.map((fmt) => ({ value: fmt, label: tc(`course.format.${fmt}`) }))} />
                      )}
                    />
                  )}
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('fields.price')}>{(f) => <Input {...f} type="number" {...form.register('price', { valueAsNumber: true })} />}</FormField>
                <FormField label={t('fields.discountPrice')}>{(f) => <Input {...f} type="number" {...form.register('discountPrice', { setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)) })} />}</FormField>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField label={t('fields.durationMonths')}>{(f) => <Input {...f} type="number" {...form.register('durationMonths', { valueAsNumber: true })} />}</FormField>
                <FormField label={t('fields.lessonsPerWeek')}>{(f) => <Input {...f} type="number" {...form.register('lessonsPerWeek', { valueAsNumber: true })} />}</FormField>
                <FormField label={t('fields.lessonMinutes')}>{(f) => <Input {...f} type="number" {...form.register('lessonMinutes', { valueAsNumber: true })} />}</FormField>
              </div>
              <FormField label={t('form.slug')}>{(f) => <Input {...f} {...form.register('slug')} />}</FormField>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-ice">
                  <input type="checkbox" {...form.register('isPublished')} className="accent-oxide" /> {t('fields.isPublished')}
                </label>
                <label className="flex items-center gap-2 text-sm text-ice">
                  <input type="checkbox" {...form.register('isFeatured')} className="accent-oxide" /> {t('fields.isFeatured')}
                </label>
              </div>
            </CardBody>
          </Card>
        </div>
      </form>

      {/* Unsaved-changes prompt */}
      <Modal
        open={blocker.state === 'blocked'}
        onOpenChange={(v) => !v && blocker.reset?.()}
        title={t('form.unsavedTitle')}
        description={t('form.unsavedDesc')}
        size="sm"
        closeLabel={tc('actions.close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => blocker.reset?.()}>{t('form.stay')}</Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>{t('form.leave')}</Button>
          </>
        }
      >
        <span className="sr-only">{t('form.unsavedDesc')}</span>
      </Modal>
    </>
  );
}
