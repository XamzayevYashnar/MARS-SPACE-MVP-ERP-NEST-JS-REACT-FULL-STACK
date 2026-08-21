import { Prisma } from '@prisma/client';
import { DEFAULT_LANGUAGE, Language, SUPPORTED_LANGUAGES } from '../enums/language.enum';
import { LocalizedStringList, LocalizedText } from '../interfaces';

/**
 * Helpers for the JSONB localisation strategy of §5.1.
 *
 * Prisma types JSON columns as `Prisma.JsonValue`, which is deliberately wide.
 * These functions are the only place that narrows it, so no module has to
 * reach for a cast to read localised content.
 */

const EMPTY_TEXT: LocalizedText = { uz: '', ru: '', en: '' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads a JSONB column into a `LocalizedText`, tolerating partial rows. */
export function toLocalizedText(value: Prisma.JsonValue | null | undefined): LocalizedText {
  if (!isRecord(value)) {
    return { ...EMPTY_TEXT };
  }

  return {
    uz: typeof value['uz'] === 'string' ? value['uz'] : '',
    ru: typeof value['ru'] === 'string' ? value['ru'] : '',
    en: typeof value['en'] === 'string' ? value['en'] : '',
  };
}

/** Same as `toLocalizedText` but preserves `null` for optional columns. */
export function toOptionalLocalizedText(
  value: Prisma.JsonValue | null | undefined,
): LocalizedText | null {
  return value === null || value === undefined ? null : toLocalizedText(value);
}

/** Reads a JSONB column holding `{ uz: string[], ru: string[], en: string[] }`. */
export function toLocalizedStringList(
  value: Prisma.JsonValue | null | undefined,
): LocalizedStringList | null {
  if (!isRecord(value)) {
    return null;
  }

  const readList = (key: Language): string[] => {
    const list = value[key];
    return Array.isArray(list)
      ? list.filter((item): item is string => typeof item === 'string')
      : [];
  };

  return {
    uz: readList(Language.UZ),
    ru: readList(Language.RU),
    en: readList(Language.EN),
  };
}

/**
 * Flattens a `LocalizedText` to one string for the requested language,
 * falling back to `uz` when the translation is missing or empty (§5.1).
 */
export function pickLanguage(text: LocalizedText, lang: Language = DEFAULT_LANGUAGE): string {
  const value = text[lang];
  return value && value.trim().length > 0 ? value : text[DEFAULT_LANGUAGE];
}

/** `pickLanguage` for nullable fields. */
export function pickLanguageOptional(
  text: LocalizedText | null | undefined,
  lang: Language = DEFAULT_LANGUAGE,
): string | null {
  return text ? pickLanguage(text, lang) : null;
}

/** Flattens a localised list with the same `uz` fallback rule. */
export function pickLanguageList(
  list: LocalizedStringList | null | undefined,
  lang: Language = DEFAULT_LANGUAGE,
): string[] | null {
  if (!list) {
    return null;
  }
  const value = list[lang];
  return value && value.length > 0 ? value : list[DEFAULT_LANGUAGE];
}

/**
 * Casts a plain object to the type Prisma expects for a **required** JSON
 * column. Centralised so the cast appears once instead of at every write site.
 */
export function toJsonInput(value: object): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * Same for a **nullable** JSON column: `null` must become `Prisma.JsonNull`,
 * because a bare `null` would be read as "leave the column untouched".
 */
export function toNullableJsonInput(
  value: object | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === null || value === undefined ? Prisma.JsonNull : toJsonInput(value);
}

/**
 * Normalises a localised value on write: trims every locale and guarantees the
 * three keys exist, so a partial payload never produces a ragged JSONB row.
 */
export function normalizeLocalizedText(input: Partial<LocalizedText>): LocalizedText {
  const result: LocalizedText = { ...EMPTY_TEXT };
  for (const lang of SUPPORTED_LANGUAGES) {
    result[lang] = (input[lang] ?? '').trim();
  }
  return result;
}
