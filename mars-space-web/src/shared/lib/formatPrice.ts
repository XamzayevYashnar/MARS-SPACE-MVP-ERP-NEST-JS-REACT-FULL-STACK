import type { Language } from '@/shared/config/constants';

const LOCALE_MAP: Record<Language, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

/**
 * Grouping separators to normalise to a plain space: regular space, NBSP,
 * narrow NBSP, comma, dot. Built via RegExp so no literal irregular whitespace
 * appears in source.
 */
const GROUP_SEPARATORS = new RegExp('[\\u0020\\u00A0\\u202F,.]', 'g');

/**
 * Format a price with space thousands separators and the currency suffix
 * (spec §8): `1 200 000 so'm`. UZS renders as `so'm`; other currencies keep
 * their code.
 */
export function formatPrice(amount: number, lang: Language, currency = 'UZS'): string {
  const formatted = new Intl.NumberFormat(LOCALE_MAP[lang], {
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(GROUP_SEPARATORS, ' ')
    .trim();

  const suffix = currency === 'UZS' ? "so'm" : currency;
  return `${formatted} ${suffix}`;
}
