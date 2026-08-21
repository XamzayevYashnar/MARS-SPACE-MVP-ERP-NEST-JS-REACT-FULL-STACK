import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, ru, uz } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import type { Language } from '@/shared/config/constants';

const LOCALE_MAP: Record<Language, Locale> = { uz, ru, en: enUS };

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

/** Format a date with the active locale. Default pattern: `d MMM yyyy`. */
export function formatDate(
  value: Date | string,
  lang: Language,
  pattern = 'd MMM yyyy',
): string {
  return format(toDate(value), pattern, { locale: LOCALE_MAP[lang] });
}

/** Compact readout for the Mission Board / telemetry, e.g. `02 SEP`. */
export function formatDateShort(value: Date | string, lang: Language): string {
  return format(toDate(value), 'dd MMM', { locale: LOCALE_MAP[lang] }).toUpperCase();
}

/** Relative time, e.g. "3 kun oldin" — used in admin lead lists. */
export function formatRelative(value: Date | string, lang: Language): string {
  return formatDistanceToNow(toDate(value), { locale: LOCALE_MAP[lang], addSuffix: true });
}
