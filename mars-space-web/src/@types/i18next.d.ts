import 'i18next';
import type { defaultNS, resources } from '@/shared/config/i18n';

// Type-safe translation keys: t('nav.home') is checked against the uz resources.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['uz'];
  }
}
