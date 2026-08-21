import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/shared/seo/Seo';
import { LoginForm } from '@/features/auth-login/LoginForm';
import { useAuthStore } from '@/store/auth.store';
import { paths } from '@/app/router/paths';

export function AdminLoginPage() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));

  useEffect(() => {
    if (isAuthenticated) void navigate(paths.admin.dashboard, { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Seo title={t('login.title')} noindex />
      <div className="flex min-h-screen items-center justify-center bg-void px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 rounded-sm bg-oxide" aria-hidden="true" />
            <h1 className="font-display text-h3">{t('login.title')}</h1>
            <p className="mt-1 text-sm text-dust">{t('login.subtitle')}</p>
          </div>
          <div className="rounded-md border border-hairline bg-basalt p-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
