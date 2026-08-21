import { describe, expect, it } from 'vitest';
import { formatPrice } from './formatPrice';
import { formatPhone, normalizePhone } from './formatPhone';
import { phoneSchema } from '@/shared/validation/phone.schema';

describe('formatPrice', () => {
  it('formats UZS with space separators and suffix', () => {
    expect(formatPrice(1_200_000, 'uz')).toBe("1 200 000 so'm");
  });

  it('keeps the currency code for non-UZS', () => {
    expect(formatPrice(500, 'en', 'USD')).toBe('500 USD');
  });
});

describe('formatPhone', () => {
  it('pretty-prints a canonical number', () => {
    expect(formatPhone('+998901234567')).toBe('+998 (90) 123-45-67');
  });

  it('normalises formatting characters', () => {
    expect(normalizePhone('+998 (90) 123-45-67')).toBe('+998901234567');
  });
});

describe('phoneSchema', () => {
  it('accepts a valid uz number after normalising', () => {
    expect(phoneSchema.parse('+998 90 123 45 67')).toBe('+998901234567');
  });

  it('rejects an invalid number with the i18n key', () => {
    const result = phoneSchema.safeParse('12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.phone.invalid');
    }
  });
});
