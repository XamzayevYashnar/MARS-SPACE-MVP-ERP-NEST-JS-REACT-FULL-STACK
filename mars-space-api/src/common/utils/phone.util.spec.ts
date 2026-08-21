import { isValidUzbekPhone, normalizePhone } from './phone.util';

describe('normalizePhone', () => {
  it('accepts an already canonical number', () => {
    expect(normalizePhone('+998901234567')).toBe('+998901234567');
  });

  it.each([
    ['+998 90 123 45 67'],
    ['998 90 123 45 67'],
    ['+998-90-123-45-67'],
    ['(998) 90 123-45-67'],
  ])('strips formatting from %s', (input) => {
    expect(normalizePhone(input)).toBe('+998901234567');
  });

  it('prefixes the country code onto a bare 9-digit local number', () => {
    expect(normalizePhone('901234567')).toBe('+998901234567');
    expect(normalizePhone('90 123 45 67')).toBe('+998901234567');
  });

  it.each([
    ['', 'an empty string'],
    ['12345', 'too few digits'],
    ['+9989012345678', 'too many digits'],
    ['+7 900 123 45 67', 'a non-Uzbek country code'],
    ['abcdefghi', 'letters only'],
  ])('rejects %s (%s)', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('reports validity through isValidUzbekPhone', () => {
    expect(isValidUzbekPhone('90 123 45 67')).toBe(true);
    expect(isValidUzbekPhone('123')).toBe(false);
  });
});
