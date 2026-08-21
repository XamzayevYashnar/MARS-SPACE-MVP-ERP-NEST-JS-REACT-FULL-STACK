import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Send, Camera } from 'lucide-react';
import { Container } from '@/shared/ui';
import { paths } from '@/app/router/paths';
import { useSettings } from '@/shared/api/settings.api';
import { useLocalize } from '@/shared/lib/localize';
import { formatPhone, phoneHref } from '@/shared/lib/formatPhone';
import { LanguageSwitcher } from '@/features/language-switcher/LanguageSwitcher';

export function SiteFooter() {
  const { t } = useTranslation();
  const { t: tl } = useLocalize();
  const { data: settings } = useSettings();
  const contacts = settings?.contacts;
  const socials = settings?.socials;

  const navItems = [
    { to: paths.courses, label: t('nav.courses') },
    { to: paths.teachers, label: t('nav.teachers') },
    { to: paths.about, label: t('nav.about') },
    { to: paths.news, label: t('nav.news') },
    { to: paths.contact, label: t('nav.contact') },
  ];

  return (
    <footer className="mt-16 border-t border-hairline bg-basalt">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-sm bg-oxide" aria-hidden="true" />
            <span className="font-display text-lg font-bold">{t('brand.name')}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-dust">{t('seo.defaultDescription')}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-4">{t('footer.navTitle')}</h2>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm text-dust transition-colors hover:text-ice">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-4">{t('footer.contactTitle')}</h2>
          <ul className="space-y-3 text-sm">
            {contacts?.phone && (
              <li>
                <a
                  href={phoneHref(contacts.phone)}
                  className="inline-flex items-center gap-2 text-dust transition-colors hover:text-ice"
                >
                  <Phone className="h-4 w-4" /> {formatPhone(contacts.phone)}
                </a>
              </li>
            )}
            {contacts?.email && (
              <li>
                <a
                  href={`mailto:${contacts.email}`}
                  className="inline-flex items-center gap-2 text-dust transition-colors hover:text-ice"
                >
                  <Mail className="h-4 w-4" /> {contacts.email}
                </a>
              </li>
            )}
            {contacts?.address && <li className="text-dust">{tl(contacts.address)}</li>}
          </ul>

          {(socials?.telegram || socials?.instagram) && (
            <div className="mt-4 flex gap-2">
              {socials?.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline text-dust transition-colors hover:border-oxide/40 hover:text-ice"
                >
                  <Send className="h-4 w-4" />
                </a>
              )}
              {socials?.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline text-dust transition-colors hover:border-oxide/40 hover:text-ice"
                >
                  <Camera className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </Container>

      <div className="border-t border-hairline">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-dust sm:flex-row">
          <p className="font-mono">
            © {new Date().getFullYear()} {t('brand.name')}
          </p>
          <p>{t('footer.rights')}</p>
        </Container>
      </div>
    </footer>
  );
}
