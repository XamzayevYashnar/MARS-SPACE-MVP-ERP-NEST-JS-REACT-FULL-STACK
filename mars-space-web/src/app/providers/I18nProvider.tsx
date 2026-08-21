import { type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/config/i18n';

/** Provides the initialised i18next instance to the tree. */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
