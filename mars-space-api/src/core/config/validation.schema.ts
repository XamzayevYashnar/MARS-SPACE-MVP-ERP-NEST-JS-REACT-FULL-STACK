import * as Joi from 'joi';

/**
 * Joi schema for every environment variable the application reads.
 *
 * `ConfigModule` validates `process.env` against this on boot with
 * `abortEarly: false`, so an invalid deployment fails fast with the full
 * list of problems instead of crashing later at an arbitrary call site.
 */
export const validationSchema = Joi.object({
  // ── Application ────────────────────────────────────────────
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),

  // ── Database ───────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // ── Authentication ─────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .required()
    .invalid(Joi.ref('JWT_ACCESS_SECRET'))
    .messages({ 'any.invalid': 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET' }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Storage ────────────────────────────────────────────────
  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),
  STORAGE_PUBLIC_URL: Joi.string().uri().default('http://localhost:4000/uploads'),
  STORAGE_MAX_FILE_SIZE: Joi.number()
    .integer()
    .positive()
    .default(5 * 1024 * 1024),
  S3_ENDPOINT: Joi.string().allow('').default(''),
  S3_BUCKET: Joi.string().allow('').default(''),
  S3_REGION: Joi.string().allow('').default(''),
  S3_ACCESS_KEY: Joi.string().allow('').default(''),
  S3_SECRET_KEY: Joi.string().allow('').default(''),

  // ── Notifications ──────────────────────────────────────────
  // Both are optional: an unconfigured notifier logs a warning instead of
  // failing the request that triggered it (see §13 acceptance criteria).
  TELEGRAM_BOT_TOKEN: Joi.string().allow('').default(''),
  TELEGRAM_CHAT_ID: Joi.string().allow('').default(''),

  // ── Rate limiting ──────────────────────────────────────────
  THROTTLE_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),

  // ── Seeding ────────────────────────────────────────────────
  SEED_ADMIN_EMAIL: Joi.string().email().default('admin@marsspace.uz'),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default('ChangeMe123!'),
  SEED_MANAGER_EMAIL: Joi.string().email().default('manager@marsspace.uz'),
  SEED_MANAGER_PASSWORD: Joi.string().min(8).default('ChangeMe123!'),
})
  // S3 credentials become mandatory the moment the s3 driver is selected.
  .when(Joi.object({ STORAGE_DRIVER: Joi.valid('s3') }).unknown(), {
    then: Joi.object({
      S3_ENDPOINT: Joi.string().uri().required(),
      S3_BUCKET: Joi.string().min(1).required(),
      S3_ACCESS_KEY: Joi.string().min(1).required(),
      S3_SECRET_KEY: Joi.string().min(1).required(),
    }),
  });
