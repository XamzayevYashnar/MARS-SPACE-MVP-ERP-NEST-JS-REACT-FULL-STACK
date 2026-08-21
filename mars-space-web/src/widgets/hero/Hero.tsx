import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container } from '@/shared/ui';
import { paths } from '@/app/router/paths';
import { useSettings } from '@/shared/api/settings.api';
import { useLocalize } from '@/shared/lib/localize';
import { useLeadModal } from '@/features/lead-form';
import { MissionBoard } from '@/widgets/mission-board/MissionBoard';

export function Hero() {
  const { t } = useTranslation('home');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();
  const openModal = useLeadModal((s) => s.openModal);
  const { data: settings } = useSettings();
  const stats = settings?.hero_stats ?? [];

  return (
    <section className="relative overflow-hidden border-b border-hairline">
      {/* Hairline grid backdrop + a single oxide accent line (spec §6.1). */}
      <div className="hairline-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute left-0 top-24 h-px w-full bg-oxide/40" aria-hidden="true" />

      <Container className="relative grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 className="mt-4 font-display text-display-lg lg:text-display-xl">{t('hero.title')}</h1>
          <p className="mt-5 max-w-md text-lg text-dust">{t('hero.subtitle')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => openModal({ source: 'HERO_FORM' })}>
              {tc('actions.apply')}
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to={paths.courses}>{tc('actions.viewCourses')}</Link>
            </Button>
          </div>

          {stats.length > 0 && (
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.key} className="bg-basalt p-4">
                  <dd className="font-mono text-2xl text-sol">{stat.value}</dd>
                  <dt className="mt-1 text-xs text-dust">{tl(stat.label)}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <MissionBoard />
          </div>
        </div>
      </Container>
    </section>
  );
}
