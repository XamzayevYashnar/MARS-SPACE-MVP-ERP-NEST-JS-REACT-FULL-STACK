import { useTranslation } from 'react-i18next';
import type { Language } from '@/shared/config/constants';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/shared/config/constants';
import type { Localized, LocalizedList } from '@/shared/types/common.types';

const FALLBACK_ORDER: Language[] = ['uz', 'ru', 'en'];

function normalizeLang(lang: string): Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as Language)
    : DEFAULT_LANGUAGE;
}

/**
 * Resolve a localised value to a string (spec §7.2).
 * Fallback order: current → uz → ru → en → ''.
 * Accepts an already-flattened string (returned as-is) or null/undefined.
 */
export function localize(value: Localized | null | undefined, lang: Language): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;

  const current = value[lang];
  if (current && current.trim()) return current;

  for (const fallback of FALLBACK_ORDER) {
    const candidate = value[fallback];
    if (candidate && candidate.trim()) return candidate;
  }
  return '';
}

/** List variant of {@link localize} — resolves a localised string array. */
export function localizeList(value: LocalizedList | null | undefined, lang: Language): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;

  const current = value[lang];
  if (current && current.length) return current;

  for (const fallback of FALLBACK_ORDER) {
    const candidate = value[fallback];
    if (candidate && candidate.length) return candidate;
  }
  return [];
}

/**
 * Hook returning localiser functions bound to the active i18n language, so
 * components never touch `title.uz` directly.
 */
export function useLocalize() {
  const { i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);

  return {
    lang,
    t: (value: Localized | null | undefined) => localize(value, lang),
    tList: (value: LocalizedList | null | undefined) => localizeList(value, lang),
  };
}
