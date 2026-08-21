import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, Input, Select, Textarea } from '@/shared/ui';
import { useCourses } from '@/entities/course/hooks';
import { useCreateLead } from '@/entities/lead/hooks';
import { useLocalize } from '@/shared/lib/localize';
import { getApiErrorMessage, getFieldErrors } from '@/shared/lib/apiError';
import type { LeadSource } from '@/shared/types/common.types';
import { leadFormSchema, type LeadFormValues } from './lead.schema';
import { PhoneInput } from './PhoneInput';

export interface LeadFormProps {
  /** Fixed course (course page / Mission Board). Hides the course select. */
  courseId?: string;
  courseTitle?: string;
  source?: LeadSource;
  pageUrl?: string;
  onSuccess?: () => void;
  /** Inline variant relaxes spacing for the CTA banner. */
  variant?: 'modal' | 'inline';
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function LeadForm({
  courseId,
  courseTitle,
  source = 'WEBSITE_FORM',
  pageUrl,
  onSuccess,
  variant = 'modal',
}: LeadFormProps) {
  const { t } = useTranslation();
  const { t: tl } = useLocalize();
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  // Course options only needed when the course isn't fixed.
  const { data: courses } = useCourses({ limit: 100 });
  const courseOptions = [
    { value: '', label: t('lead.courseNone') },
    ...(courses?.items.map((c) => ({ value: c.id, label: tl(c.title) })) ?? []),
  ];

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { fullName: '', phone: '', courseId: courseId ?? '', message: '', website: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (values.website) return; // honeypot tripped — silently drop
    try {
      await createLead.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
        courseId: values.courseId || undefined,
        message: values.message || undefined,
        source,
        pageUrl: pageUrl ?? window.location.href,
      });
      window.dataLayer?.push({ event: 'lead_submitted', course_id: values.courseId || null });
      toast.success(t('lead.toastSuccess'));
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      for (const fieldError of getFieldErrors(error)) {
        setError(fieldError.field as keyof LeadFormValues, {
          message: t(fieldError.message as never, { defaultValue: fieldError.message }),
        });
      }
      toast.error(getApiErrorMessage(error));
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-md border border-signal/40 bg-signal/5 px-6 py-10 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-signal" aria-hidden="true" />
        <h3 className="font-display text-h3">{t('lead.successTitle')}</h3>
        <p className="mt-2 max-w-sm text-sm text-dust">{t('lead.successDescription')}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSubmitted(false)}>
          {t('lead.again')}
        </Button>
      </div>
    );
  }

  const layout = variant === 'inline' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4';

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className={layout}>
      <FormField label={t('lead.name')} required error={errors.fullName?.message}>
        {(field) => (
          <Input
            {...field}
            {...register('fullName')}
            placeholder={t('lead.namePlaceholder')}
            invalid={field['aria-invalid']}
          />
        )}
      </FormField>

      <FormField label={t('lead.phone')} required error={errors.phone?.message}>
        {(field) => (
          <Controller
            control={control}
            name="phone"
            render={({ field: ctrl }) => (
              <PhoneInput
                id={field.id}
                value={ctrl.value}
                onChange={ctrl.onChange}
                onBlur={ctrl.onBlur}
                invalid={field['aria-invalid']}
              />
            )}
          />
        )}
      </FormField>

      {courseTitle ? (
        <input type="hidden" {...register('courseId')} />
      ) : (
        <FormField label={t('lead.course')} error={errors.courseId?.message}>
          {(field) => (
            <Controller
              control={control}
              name="courseId"
              render={({ field: ctrl }) => (
                <Select
                  id={field.id}
                  value={ctrl.value}
                  onValueChange={ctrl.onChange}
                  options={courseOptions}
                  placeholder={t('lead.coursePlaceholder')}
                />
              )}
            />
          )}
        </FormField>
      )}

      <FormField
        label={t('lead.message')}
        error={errors.message?.message}
        className={variant === 'inline' ? 'sm:col-span-2' : undefined}
      >
        {(field) => (
          <Textarea
            {...field}
            {...register('message')}
            rows={3}
            placeholder={t('lead.messagePlaceholder')}
          />
        )}
      </FormField>

      {/* Honeypot — hidden from users, visible to bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register('website')}
      />

      <div className={variant === 'inline' ? 'sm:col-span-2' : undefined}>
        {courseTitle && (
          <p className="mb-3 text-sm text-dust">
            {t('lead.course')}: <span className="text-ice">{courseTitle}</span>
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {t('lead.submit')}
        </Button>
      </div>
    </form>
  );
}
