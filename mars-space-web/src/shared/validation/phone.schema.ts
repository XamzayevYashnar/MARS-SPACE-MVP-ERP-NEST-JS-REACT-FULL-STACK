import { z } from 'zod';

/**
 * Uzbek phone number. Normalises formatting characters then requires the
 * canonical `+998XXXXXXXXX` form. The message is an i18n key resolved at render
 * time (spec §9).
 */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[^\d+]/g, ''))
  .refine((v) => /^\+998\d{9}$/.test(v), { message: 'validation.phone.invalid' });
