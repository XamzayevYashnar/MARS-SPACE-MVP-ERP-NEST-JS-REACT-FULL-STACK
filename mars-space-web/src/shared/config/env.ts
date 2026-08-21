import { z } from 'zod';

/**
 * Typed, validated access to `import.meta.env`.
 * Fails fast at startup (imported from main.tsx) so a missing/invalid var is
 * a hard error instead of a silent `undefined` deep in a request.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  VITE_SITE_URL: z.string().url().default('http://localhost:5173'),
  VITE_TELEGRAM_URL: z.string().url().optional(),
  VITE_INSTAGRAM_URL: z.string().url().optional(),
  VITE_YANDEX_MAP_KEY: z.string().optional().default(''),
  VITE_GA_ID: z.string().optional().default(''),
  VITE_MOCK_API: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // Surface a readable message rather than a raw ZodError dump.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
