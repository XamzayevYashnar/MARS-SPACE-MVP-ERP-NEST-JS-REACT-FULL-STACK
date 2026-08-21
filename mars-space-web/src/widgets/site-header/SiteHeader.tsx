import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { Button, Container } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { paths } from '@/app/router/paths';
import { LanguageSwitcher } from '@/features/language-switcher/LanguageSwitcher';
import { ThemeToggle } from '@/features/theme-toggle/ThemeToggle';
import { useLeadModal } from '@/features/lead-form';
import { useScrollLock } from '@/shared/hooks/useScrollLock';

function useNavItems() {
  const { t } = useTranslation();
  return [
    { to: paths.courses, label: t('nav.courses') },
    { to: paths.teachers, label: t('nav.teachers') },
    { to: paths.about, label: t('nav.about') },
    { to: paths.news, label: t('nav.news') },
    { to: paths.contact, label: t('nav.contact') },
  ];
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition-colors hover:text-ice',
    isActive ? 'text-ice' : 'text-dust',
  );

export function SiteHeader() {
  const { t } = useTranslation();
  const items = useNavItems();
  const openModal = useLeadModal((s) => s.openModal);
  const [mobileOpen, setMobileOpen] = useState(false);
  useScrollLock(mobileOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-void/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to={paths.home} className="flex items-center gap-2" aria-label={t('brand.name')}>
          <span className="inline-block h-6 w-6 rounded-sm bg-oxide" aria-hidden="true" />
          <span className="font-display text-lg font-bold tracking-tight">{t('brand.name')}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button size="sm" onClick={() => openModal({ source: 'WEBSITE_FORM' })}>
            {t('actions.apply')}
          </Button>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-hairline text-ice lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-void lg:hidden">
          <Container className="flex flex-col gap-4 py-6">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-sm px-3 py-2 text-base transition-colors',
                      isActive ? 'bg-basalt-raised text-ice' : 'text-dust hover:text-ice',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
