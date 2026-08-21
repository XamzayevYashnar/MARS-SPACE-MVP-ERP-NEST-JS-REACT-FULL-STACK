import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { paths } from '@/app/router/paths';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('states.notFoundTitle')} noindex />
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-6xl text-oxide">404</p>
        <h1 className="mt-6 font-display text-h2">{t('states.notFoundTitle')}</h1>
        <p className="mt-3 max-w-sm text-dust">{t('states.notFoundDescription')}</p>
        <Button className="mt-8" asChild>
          <Link to={paths.home}>{t('nav.home')}</Link>
        </Button>
      </Container>
    </>
  );
}
