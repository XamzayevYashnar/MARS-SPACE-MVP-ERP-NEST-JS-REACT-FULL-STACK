import { Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type Language } from '@/shared/config/constants';
import { cn } from '@/shared/lib/cn';

export interface LangTabStripProps {
  active: Language;
  onChange: (lang: Language) => void;
  /** Whether each language's required fields are filled (completeness dot). */
  completeness: Record<Language, boolean>;
}

/** UZ / RU / EN tab strip with per-tab completeness (spec §6.4). */
export function LangTabStrip({ active, onChange, completeness }: LangTabStripProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-basalt p-0.5">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = lang === active;
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(lang)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
              isActive ? 'bg-oxide text-ice' : 'text-dust hover:text-ice',
            )}
          >
            {lang}
            {completeness[lang] ? (
              <Check className={cn('h-3 w-3', isActive ? 'text-ice' : 'text-signal')} />
            ) : (
              <span
                className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-ice/60' : 'bg-dust/50')}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
