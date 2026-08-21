import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './constants';

import commonUz from '@/locales/uz/common.json';
import commonRu from '@/locales/ru/common.json';
import commonEn from '@/locales/en/common.json';
import validationUz from '@/locales/uz/validation.json';
import validationRu from '@/locales/ru/validation.json';
import validationEn from '@/locales/en/validation.json';
import homeUz from '@/locales/uz/home.json';
import homeRu from '@/locales/ru/home.json';
import homeEn from '@/locales/en/home.json';
import coursesUz from '@/locales/uz/courses.json';
import coursesRu from '@/locales/ru/courses.json';
import coursesEn from '@/locales/en/courses.json';
import aboutUz from '@/locales/uz/about.json';
import aboutRu from '@/locales/ru/about.json';
import aboutEn from '@/locales/en/about.json';
import contactUz from '@/locales/uz/contact.json';
import contactRu from '@/locales/ru/contact.json';
import contactEn from '@/locales/en/contact.json';
import adminUz from '@/locales/uz/admin.json';
import adminRu from '@/locales/ru/admin.json';
import adminEn from '@/locales/en/admin.json';

export const defaultNS = 'common';

export const resources = {
  uz: {
    common: commonUz,
    validation: validationUz,
    home: homeUz,
    courses: coursesUz,
    about: aboutUz,
    contact: contactUz,
    admin: adminUz,
  },
  ru: {
    common: commonRu,
    validation: validationRu,
    home: homeRu,
    courses: coursesRu,
    about: aboutRu,
    contact: contactRu,
    admin: adminRu,
  },
  en: {
    common: commonEn,
    validation: validationEn,
    home: homeEn,
    courses: coursesEn,
    about: aboutEn,
    contact: contactEn,
    admin: adminEn,
  },
} as const;

const LANG_STORAGE_KEY = 'mars-lang';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: ['common', 'validation', 'home', 'courses', 'about', 'contact', 'admin'],
    defaultNS,
    // Detection order per spec §8: localStorage → navigator → fallback uz.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
    // Resources are bundled, so translations resolve synchronously — no Suspense.
    react: { useSuspense: false },
  });

// Keep <html lang> in sync so screen readers and hreflang stay correct.
function syncHtmlLang(lng: string) {
  document.documentElement.setAttribute('lang', lng);
}
syncHtmlLang(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
