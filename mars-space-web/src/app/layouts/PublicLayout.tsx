import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteHeader } from '@/widgets/site-header/SiteHeader';
import { SiteFooter } from '@/widgets/site-footer/SiteFooter';
import { LeadModal, useLeadModal } from '@/features/lead-form';

/**
 * Public site shell: skip link, sticky header, page outlet, footer, a global
 * lead modal, and a sticky mobile CTA bar reachable from every page (spec §5).
 */
export function PublicLayout() {
  const { t } = useTranslation();
  const openModal = useLeadModal((s) => s.openModal);

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <a href="#main" className="skip-link">
        {t('misc.skipToContent')}
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />

      {/* Sticky mobile CTA — the one place elevation uses a shadow (spec §4.4). */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-basalt/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => openModal({ source: 'WEBSITE_FORM' })}
          className="flex h-12 w-full items-center justify-center rounded-sm bg-oxide font-medium text-ice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
        >
          {t('actions.apply')}
        </button>
      </div>
      {/* Spacer so the fixed bar never covers footer content on mobile. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      <LeadModal />
      <ScrollRestoration />
    </div>
  );
}
