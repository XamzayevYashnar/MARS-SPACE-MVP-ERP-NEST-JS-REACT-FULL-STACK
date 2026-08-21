import { forwardRef } from 'react';
import { Input, type InputProps } from '@/shared/ui';

/** Extract up to 9 national digits (after the 998 country code). */
function toNational(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** Format national digits as `+998 (90) 123-45-67`, progressively. */
function format(national: string): string {
  if (!national) return '';
  const a = national.slice(0, 2);
  const b = national.slice(2, 5);
  const c = national.slice(5, 7);
  const d = national.slice(7, 9);
  let out = '+998';
  if (a) out += ` (${a}`;
  if (a.length === 2) out += ')';
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
}

export interface PhoneInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Canonical value, e.g. `+998901234567` (may be partial while typing). */
  value: string;
  /** Emits the canonical value `+998` + national digits. */
  onChange: (value: string) => void;
}

/**
 * Masked Uzbek phone input (spec §9). Displays `+998 (__) ___-__-__`,
 * stores the canonical `+998XXXXXXXXX` form for validation and submission.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const national = toNational(value);
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+998 (__) ___-__-__"
        value={format(national)}
        onChange={(e) => {
          const nextNational = toNational(e.target.value);
          onChange(nextNational ? `+998${nextNational}` : '');
        }}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
