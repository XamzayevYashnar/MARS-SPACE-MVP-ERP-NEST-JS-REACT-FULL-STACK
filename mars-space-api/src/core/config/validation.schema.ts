import * as Joi from 'joi';

/**
 * Every secret that ships in `.env.example`, `.env.test` or the compose file.
 *
 * `docker-compose.yml` supplies `docker_access_secret_change_me_32` as a
 * default, so a deployment that never set the variable would boot happily on a
 * signing key published in this repository. In production these are rejected.
 */
const PLACEHOLDER_SECRETS = [
  'change_me_access',
  'change_me_refresh',
  'docker_access_secret_change_me_32',
  'docker_refresh_secret_change_me_32',
  'dev_access_secret_change_me_please_32',
  'dev_refresh_secret_change_me_please_32',
];

/**
 * In production a JWT secret must be long and must not be a known placeholder.
 *
 * The placeholder check is a `custom` rule rather than `.invalid(...)` on
 * purpose: `JWT_REFRESH_SECRET` already spends its `any.invalid` message on
 * "must differ from JWT_ACCESS_SECRET", and concatenating a second `invalid`
 * would overwrite it, reporting two identical strong secrets as a placeholder.
 */
const productionSecret = Joi.string()
  .min(32)
  .custom((value: string, helpers) =>
    PLACEHOLDER_SECRETS.includes(value) ? helpers.error('secret.placeholder') : value,
  )
  .messages({
    'secret.placeholder':
      '{{#label}} is one of the example secrets committed to this repository — generate a fresh one (e.g. `openssl rand -base64 48`)',
    'string.min': '{{#label}} must be at least 32 characters in production',
  });

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
  // `/api/docs` enumerates every admin route; production has to opt in.
  //
  // Deliberately no default. ConfigModule writes validated values back into
  // `process.env`, so a `.default('false')` here would reach `appConfig` as an
  // explicit "false" and switch the docs off in development too — where they
  // are meant to be on. Leaving it undefined lets `appConfig.swaggerEnabled`
  // decide per environment.
  SWAGGER_ENABLED: Joi.string().valid('true', 'false').optional(),

  // ── Database ───────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // ── Authentication ─────────────────────────────────────────
  JWT_ACCESS_SECRET: Joi.string()
    .min(16)
    .required()
    .when('NODE_ENV', { is: 'production', then: productionSecret }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .required()
    .invalid(Joi.ref('JWT_ACCESS_SECRET'))
    .messages({ 'any.invalid': 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET' })
    .when('NODE_ENV', { is: 'production', then: productionSecret }),
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
  // Fabricated students/leads/testimonials. Off in production unless forced.
  SEED_DEMO: Joi.string().valid('true', 'false').optional(),
})
  // S3 credentials become mandatory the moment the s3 driver is selected.
  //
  // `Joi.valid('s3')` alone also matches an *absent* STORAGE_DRIVER, because an
  // optional key satisfies a `valid()` rule when it is undefined. That made the
  // documented `local` default unusable: omitting the variable — exactly what
  // `.env.example` says you may do — failed boot with four "S3_… is required"
  // errors. `.required()` pins the condition to a driver that was actually set.
  .when(Joi.object({ STORAGE_DRIVER: Joi.string().valid('s3').required() }).unknown(), {
    then: Joi.object({
      S3_ENDPOINT: Joi.string().uri().required(),
      S3_BUCKET: Joi.string().min(1).required(),
      S3_ACCESS_KEY: Joi.string().min(1).required(),
      S3_SECRET_KEY: Joi.string().min(1).required(),
    }),
  });
