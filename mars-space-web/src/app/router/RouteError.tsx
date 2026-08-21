import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container } from '@/shared/ui';

/** Themed route-level error fallback with a reload action (spec §10). */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-6xl text-alert">{status ?? '!'}</p>
      <h1 className="mt-6 font-display text-h2">{t('states.errorTitle')}</h1>
      <p className="mt-3 max-w-sm text-dust">{t('states.errorDescription')}</p>
      <Button className="mt-8" onClick={() => window.location.reload()}>
        {t('actions.retry')}
      </Button>
    </Container>
  );
}
