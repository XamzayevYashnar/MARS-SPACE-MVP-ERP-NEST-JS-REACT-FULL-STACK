import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, Input, Textarea } from '@/shared/ui';
import { PhoneInput } from '@/features/lead-form';
import { useCreateContact } from './api';
import { contactFormSchema, type ContactFormValues } from './contact.schema';
import { getApiErrorMessage, getFieldErrors } from '@/shared/lib/apiError';

export function ContactForm() {
  const { t } = useTranslation('contact');
  const [submitted, setSubmitted] = useState(false);
  const createContact = useCreateContact();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { fullName: '', phone: '', email: '', subject: '', message: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createContact.mutateAsync({
        ...values,
        email: values.email || undefined,
        subject: values.subject || undefined,
      });
      toast.success(t('form.successTitle'));
      setSubmitted(true);
    } catch (error) {
      for (const fieldError of getFieldErrors(error)) {
        setError(fieldError.field as keyof ContactFormValues, {
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
        <h3 className="font-display text-h3">{t('form.successTitle')}</h3>
        <p className="mt-2 text-sm text-dust">{t('form.successDescription')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('form.name')} required error={errors.fullName?.message}>
          {(field) => (
            <Input {...field} {...register('fullName')} placeholder={t('form.namePlaceholder')} />
          )}
        </FormField>
        <FormField label={t('form.phone')} required error={errors.phone?.message}>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('form.email')} error={errors.email?.message}>
          {(field) => (
            <Input
              {...field}
              {...register('email')}
              type="email"
              placeholder={t('form.emailPlaceholder')}
            />
          )}
        </FormField>
        <FormField label={t('form.subject')} error={errors.subject?.message}>
          {(field) => (
            <Input {...field} {...register('subject')} placeholder={t('form.subjectPlaceholder')} />
          )}
        </FormField>
      </div>

      <FormField label={t('form.message')} required error={errors.message?.message}>
        {(field) => (
          <Textarea {...field} {...register('message')} rows={5} placeholder={t('form.messagePlaceholder')} />
        )}
      </FormField>

      <Button type="submit" size="lg" loading={isSubmitting}>
        {t('form.submit')}
      </Button>
    </form>
  );
}
