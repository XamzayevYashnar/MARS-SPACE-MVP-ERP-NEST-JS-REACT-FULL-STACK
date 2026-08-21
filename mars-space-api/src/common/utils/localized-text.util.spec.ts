import { Prisma } from '@prisma/client';
import { Language } from '../enums/language.enum';
import {
  normalizeLocalizedText,
  pickLanguage,
  pickLanguageList,
  pickLanguageOptional,
  toJsonInput,
  toLocalizedStringList,
  toLocalizedText,
  toNullableJsonInput,
  toOptionalLocalizedText,
} from './localized-text.util';

describe('toLocalizedText', () => {
  it('reads a complete JSONB value', () => {
    expect(toLocalizedText({ uz: 'Salom', ru: 'Привет', en: 'Hello' })).toEqual({
      uz: 'Salom',
      ru: 'Привет',
      en: 'Hello',
    });
  });

  it('fills missing locales with empty strings rather than undefined', () => {
    expect(toLocalizedText({ uz: 'Salom' })).toEqual({ uz: 'Salom', ru: '', en: '' });
  });

  it.each([[null], [undefined], ['a bare string'], [42], [['an', 'array']]])(
    'returns an empty shape for %p',
    (value) => {
      expect(toLocalizedText(value as Prisma.JsonValue)).toEqual({ uz: '', ru: '', en: '' });
    },
  );

  it('ignores non-string locale values', () => {
    expect(toLocalizedText({ uz: 'Salom', ru: 42, en: null })).toEqual({
      uz: 'Salom',
      ru: '',
      en: '',
    });
  });
});

describe('toOptionalLocalizedText', () => {
  it('preserves null for an optional column', () => {
    expect(toOptionalLocalizedText(null)).toBeNull();
    expect(toOptionalLocalizedText(undefined)).toBeNull();
  });

  it('reads a present value', () => {
    expect(toOptionalLocalizedText({ uz: 'Bor' })).toEqual({ uz: 'Bor', ru: '', en: '' });
  });
});

describe('toLocalizedStringList', () => {
  it('reads the three locale arrays', () => {
    expect(toLocalizedStringList({ uz: ['a'], ru: ['б'], en: ['c'] })).toEqual({
      uz: ['a'],
      ru: ['б'],
      en: ['c'],
    });
  });

  it('defaults a missing locale to an empty array', () => {
    expect(toLocalizedStringList({ uz: ['a'] })).toEqual({ uz: ['a'], ru: [], en: [] });
  });

  it('drops non-string entries', () => {
    expect(toLocalizedStringList({ uz: ['a', 1, null, 'b'] })?.uz).toEqual(['a', 'b']);
  });

  it('returns null when the column holds no object', () => {
    expect(toLocalizedStringList(null)).toBeNull();
    expect(toLocalizedStringList('text')).toBeNull();
  });
});

describe('pickLanguage', () => {
  const text = { uz: 'Salom', ru: 'Привет', en: '' };

  it('returns the requested locale', () => {
    expect(pickLanguage(text, Language.RU)).toBe('Привет');
  });

  it('falls back to uz when the translation is empty', () => {
    expect(pickLanguage(text, Language.EN)).toBe('Salom');
  });

  it('falls back to uz when the translation is only whitespace', () => {
    expect(pickLanguage({ uz: 'Salom', ru: '   ', en: '' }, Language.RU)).toBe('Salom');
  });

  it('defaults to uz when no language is given', () => {
    expect(pickLanguage(text)).toBe('Salom');
  });
});

describe('pickLanguageOptional', () => {
  it('returns null for an absent value', () => {
    expect(pickLanguageOptional(null, Language.RU)).toBeNull();
    expect(pickLanguageOptional(undefined)).toBeNull();
  });

  it('flattens a present value', () => {
    expect(pickLanguageOptional({ uz: 'Salom', ru: 'Привет', en: '' }, Language.RU)).toBe('Привет');
  });
});

describe('pickLanguageList', () => {
  const list = { uz: ['bir'], ru: ['один'], en: [] };

  it('returns the requested locale', () => {
    expect(pickLanguageList(list, Language.RU)).toEqual(['один']);
  });

  it('falls back to uz for an empty locale', () => {
    expect(pickLanguageList(list, Language.EN)).toEqual(['bir']);
  });

  it('returns null for an absent list', () => {
    expect(pickLanguageList(null)).toBeNull();
  });
});

describe('normalizeLocalizedText', () => {
  it('trims every locale and guarantees all three keys', () => {
    expect(normalizeLocalizedText({ uz: '  Salom  ', ru: 'Привет' })).toEqual({
      uz: 'Salom',
      ru: 'Привет',
      en: '',
    });
  });

  it('turns an empty input into an empty shape', () => {
    expect(normalizeLocalizedText({})).toEqual({ uz: '', ru: '', en: '' });
  });
});

describe('Prisma JSON helpers', () => {
  it('passes an object through for a required column', () => {
    expect(toJsonInput({ uz: 'Salom' })).toEqual({ uz: 'Salom' });
  });

  it('maps null and undefined to Prisma.JsonNull for a nullable column', () => {
    expect(toNullableJsonInput(null)).toBe(Prisma.JsonNull);
    expect(toNullableJsonInput(undefined)).toBe(Prisma.JsonNull);
  });

  it('passes a present value through unchanged', () => {
    expect(toNullableJsonInput({ uz: 'Salom' })).toEqual({ uz: 'Salom' });
  });
});
