import { useEffect, type ReactNode } from 'react';
import { useUiStore, type ThemeMode } from '@/store/ui.store';

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return mode;
}

/**
 * Applies the active theme as a class on <html> and keeps it in sync with the
 * OS preference when the user chose "system". Dark-first (spec §4.2).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved = resolveTheme(theme);
      root.classList.toggle('dark', resolved === 'dark');
      root.classList.toggle('light', resolved === 'light');
      root
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'dark' ? '#0A0D12' : '#F5F6F8');
    };

    apply();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    return undefined;
  }, [theme]);

  return <>{children}</>;
}
