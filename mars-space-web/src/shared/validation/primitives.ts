import { z } from 'zod';

/** Non-empty trimmed string with a minimum length; message is an i18n key. */
export const nameSchema = z
  .string()
  .trim()
  .min(3, { message: 'validation.name.min' })
  .max(120, { message: 'validation.name.max' });

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'validation.email.invalid' });

// Accepts an empty string or a valid email; no transform so RHF's input and
// output types stay identical (empty strings are dropped at submit time).
export const optionalEmailSchema = z.union([z.literal(''), emailSchema]).optional();

export { phoneSchema } from './phone.schema';
