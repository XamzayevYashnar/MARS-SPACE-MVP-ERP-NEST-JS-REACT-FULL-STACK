import { useTranslation } from 'react-i18next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { ContactForm } from '@/features/contact-form/ContactForm';
import { useSettings } from '@/shared/api/settings.api';
import { useLocalize } from '@/shared/lib/localize';
import { formatPhone, phoneHref } from '@/shared/lib/formatPhone';
import { paths } from '@/app/router/paths';

export function ContactPage() {
  const { t } = useTranslation('contact');
  const { t: tl } = useLocalize();
  const { data: settings } = useSettings();
  const contacts = settings?.contacts;

  return (
    <>
      <Seo title={t('title')} description={t('lead')} path={paths.contact} />
      <Container className="py-16">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <p className="-mt-4 mb-10 max-w-2xl text-dust">{t('lead')}</p>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-hairline bg-basalt p-6">
            <ContactForm />
          </div>

          <aside className="space-y-4">
            {contacts?.phone && (
              <a
                href={phoneHref(contacts.phone)}
                className="flex items-center gap-3 rounded-md border border-hairline bg-basalt p-4 transition-colors hover:border-oxide/40"
              >
                <Phone className="h-5 w-5 text-oxide" />
                <span>
                  <span className="block text-xs text-dust">{t('info.phone')}</span>
                  <span className="font-mono text-sm text-ice">{formatPhone(contacts.phone)}</span>
                </span>
              </a>
            )}
            {contacts?.email && (
              <a
                href={`mailto:${contacts.email}`}
                className="flex items-center gap-3 rounded-md border border-hairline bg-basalt p-4 transition-colors hover:border-oxide/40"
              >
                <Mail className="h-5 w-5 text-oxide" />
                <span>
                  <span className="block text-xs text-dust">{t('info.email')}</span>
                  <span className="text-sm text-ice">{contacts.email}</span>
                </span>
              </a>
            )}
            {contacts?.address && (
              <div className="flex items-center gap-3 rounded-md border border-hairline bg-basalt p-4">
                <MapPin className="h-5 w-5 text-oxide" />
                <span>
                  <span className="block text-xs text-dust">{t('info.address')}</span>
                  <span className="text-sm text-ice">{tl(contacts.address)}</span>
                </span>
              </div>
            )}
            {contacts?.workingHours && (
              <div className="flex items-center gap-3 rounded-md border border-hairline bg-basalt p-4">
                <Clock className="h-5 w-5 text-oxide" />
                <span>
                  <span className="block text-xs text-dust">{t('info.hours')}</span>
                  <span className="text-sm text-ice">{tl(contacts.workingHours)}</span>
                </span>
              </div>
            )}

            <div className="hairline-grid aspect-video w-full rounded-md border border-hairline" aria-hidden="true" />
          </aside>
        </div>
      </Container>
    </>
  );
}
