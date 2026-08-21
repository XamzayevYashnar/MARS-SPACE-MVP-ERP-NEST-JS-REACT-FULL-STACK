import { describe, expect, it } from 'vitest';
import { localize, localizeList } from './localize';
import type { LocalizedStringList, LocalizedText } from '@/shared/types/common.types';

describe('localize', () => {
  const value: LocalizedText = { uz: 'Salom', ru: 'Привет', en: 'Hello' };

  it('returns the current language', () => {
    expect(localize(value, 'ru')).toBe('Привет');
  });

  it('falls back current → uz → ru → en', () => {
    expect(localize({ uz: '', ru: '', en: 'Only EN' }, 'uz')).toBe('Only EN');
    expect(localize({ uz: 'UZ', ru: '', en: '' }, 'en')).toBe('UZ');
  });

  it('returns an already-flattened string as-is', () => {
    expect(localize('flat', 'uz')).toBe('flat');
  });

  it('returns empty string for null/undefined', () => {
    expect(localize(null, 'uz')).toBe('');
    expect(localize(undefined, 'ru')).toBe('');
  });
});

describe('localizeList', () => {
  const list: LocalizedStringList = { uz: ['a', 'b'], ru: [], en: ['x'] };

  it('resolves the current language', () => {
    expect(localizeList(list, 'uz')).toEqual(['a', 'b']);
  });

  it('falls back when the current language is empty', () => {
    expect(localizeList(list, 'ru')).toEqual(['a', 'b']);
  });

  it('returns a flat array as-is', () => {
    expect(localizeList(['one'], 'en')).toEqual(['one']);
  });
});
