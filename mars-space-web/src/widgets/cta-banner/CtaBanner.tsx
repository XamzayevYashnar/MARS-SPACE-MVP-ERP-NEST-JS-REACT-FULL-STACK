import { useTranslation } from 'react-i18next';
import { Container } from '@/shared/ui';
import { LeadForm } from '@/features/lead-form';

/**
 * Inline lead form (not a modal) so it is crawlable and instant (spec §6.1).
 */
export function CtaBanner() {
  const { t } = useTranslation('home');

  return (
    <section className="border-y border-hairline bg-basalt">
      <Container className="grid gap-8 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow mb-2">MARS SPACE // JOIN</p>
          <h2 className="font-display text-h2">{t('cta.title')}</h2>
          <p className="mt-3 max-w-md text-dust">{t('cta.subtitle')}</p>
        </div>
        <div className="rounded-md border border-hairline bg-void p-6">
          <LeadForm variant="inline" source="WEBSITE_FORM" />
        </div>
      </Container>
    </section>
  );
}
