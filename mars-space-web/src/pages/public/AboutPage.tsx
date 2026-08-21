import { useTranslation } from 'react-i18next';
import { Container } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { useSettings } from '@/shared/api/settings.api';
import { useLocalize } from '@/shared/lib/localize';
import { paths } from '@/app/router/paths';

interface Value {
  title: string;
  desc: string;
}

export function AboutPage() {
  const { t } = useTranslation('about');
  const { t: tl } = useLocalize();
  const { data: settings } = useSettings();
  const stats = settings?.hero_stats ?? [];
  const values = t('values', { returnObjects: true }) as Value[];

  return (
    <>
      <Seo title={t('title')} description={t('lead')} path={paths.about} />

      <section className="relative overflow-hidden border-b border-hairline">
        <div className="hairline-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <Container className="relative py-20">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-lg">{t('title')}</h1>
          <p className="mt-5 max-w-2xl text-lg text-dust">{t('lead')}</p>
        </Container>
      </section>

      <Container className="py-16">
        <p className="max-w-3xl text-lg leading-relaxed text-ice">{t('story')}</p>
      </Container>

      {stats.length > 0 && (
        <section className="border-y border-hairline bg-basalt">
          <Container className="py-16">
            <SectionHeading title={t('statsTitle')} />
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.key} className="bg-void p-6">
                  <dd className="font-mono text-3xl text-sol">{stat.value}</dd>
                  <dt className="mt-2 text-sm text-dust">{tl(stat.label)}</dt>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      )}

      <Container className="py-16">
        <SectionHeading title={t('valuesTitle')} />
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, i) => (
            <div key={i} className="rounded-md border border-hairline bg-basalt p-6">
              <span className="font-mono text-2xl text-oxide">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display text-lg">{value.title}</h3>
              <p className="mt-2 text-sm text-dust">{value.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
