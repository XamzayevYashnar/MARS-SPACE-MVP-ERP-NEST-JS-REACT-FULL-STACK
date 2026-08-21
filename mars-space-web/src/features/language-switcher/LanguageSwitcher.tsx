import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/shared/config/constants';
import { cn } from '@/shared/lib/cn';

export interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Compact UZ / RU / EN mono segmented control (spec §8). Changing the language
 * updates i18n (persisted to localStorage by the detector) and <html lang>.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'uz') as Language;

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cn(
        'inline-flex items-center rounded-sm border border-hairline bg-basalt p-0.5',
        className,
      )}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang === current;
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(lang)}
            className={cn(
              'rounded-sm px-2 py-1 font-mono text-xs uppercase tracking-wide transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
              active ? 'bg-oxide text-ice' : 'text-dust hover:text-ice',
            )}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}
