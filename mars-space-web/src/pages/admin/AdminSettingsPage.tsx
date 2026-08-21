import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, CardBody, FormField, Input, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import { useSettings } from '@/shared/api/settings.api';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import type { SettingsBundle } from '@/shared/types/settings.types';

function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) =>
      http.put(endpoints.admin.setting(key), { value }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.settings.all }),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function AdminSettingsPage() {
  const { t } = useTranslation('admin');
  const { data, isLoading } = useSettings();

  return (
    <>
      <Seo title={t('settings.title')} noindex />
      <AdminPageHeader title={t('settings.title')} />
      {isLoading || !data ? <Skeleton className="h-64 w-full" /> : <SettingsForms data={data} />}
    </>
  );
}

/** Child initialised from loaded data — no state-syncing effect needed. */
function SettingsForms({ data }: { data: SettingsBundle }) {
  const { t } = useTranslation('admin');
  const save = useSaveSetting();
  const [contacts, setContacts] = useState({
    phone: data.contacts.phone ?? '',
    email: data.contacts.email ?? '',
  });
  const [socials, setSocials] = useState({
    telegram: data.socials.telegram ?? '',
    instagram: data.socials.instagram ?? '',
  });

  const saveContacts = () =>
    save.mutate(
      { key: 'contacts', value: { ...data.contacts, ...contacts } },
      { onSuccess: () => toast.success(t('settings.saved')) },
    );
  const saveSocials = () =>
    save.mutate(
      { key: 'socials', value: { ...data.socials, ...socials } },
      { onSuccess: () => toast.success(t('settings.saved')) },
    );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="eyebrow">{t('settings.contacts')}</h2>
            <FormField label={t('settings.phone')}>
              {(f) => (
                <Input {...f} value={contacts.phone} onChange={(e) => setContacts((c) => ({ ...c, phone: e.target.value }))} />
              )}
            </FormField>
            <FormField label={t('settings.email')}>
              {(f) => (
                <Input {...f} value={contacts.email} onChange={(e) => setContacts((c) => ({ ...c, email: e.target.value }))} />
              )}
            </FormField>
            <Button loading={save.isPending} onClick={saveContacts}>
              {t('actions.save')}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="eyebrow">{t('settings.socials')}</h2>
            <FormField label={t('settings.telegram')}>
              {(f) => (
                <Input {...f} value={socials.telegram} onChange={(e) => setSocials((c) => ({ ...c, telegram: e.target.value }))} />
              )}
            </FormField>
            <FormField label={t('settings.instagram')}>
              {(f) => (
                <Input {...f} value={socials.instagram} onChange={(e) => setSocials((c) => ({ ...c, instagram: e.target.value }))} />
              )}
            </FormField>
            <Button loading={save.isPending} onClick={saveSocials}>
              {t('actions.save')}
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="eyebrow mb-4">{t('settings.heroStats')}</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {data.hero_stats.map((stat) => (
                <div key={stat.key} className="rounded-md border border-hairline p-4">
                  <p className="font-mono text-2xl text-sol">{stat.value}</p>
                  <p className="mt-1 text-xs text-dust">{typeof stat.label === 'string' ? stat.label : stat.label.uz}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
