import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/shared/lib/cn';

export interface ThemeToggleProps {
  className?: string;
}

/** Dark/light toggle (spec §4.2). Reflects and updates the persisted UI store. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const isDark = theme !== 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline bg-basalt text-dust',
        'transition-colors hover:border-dust/40 hover:text-ice',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
