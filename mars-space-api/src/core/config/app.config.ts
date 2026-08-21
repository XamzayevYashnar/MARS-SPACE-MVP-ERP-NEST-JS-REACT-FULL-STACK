import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isTest: boolean;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  logLevel: string;
  throttleTtlSeconds: number;
  throttleLimit: number;
}

/**
 * Application-level settings.
 *
 * This is one of only two places in the codebase allowed to touch
 * `process.env` (the other being the Prisma datasource block). Everything
 * else reads configuration through `ConfigService.getOrThrow<AppConfig>('app')`.
 */
export const appConfig = registerAs<AppConfig>('app', () => ({
  nodeEnv: (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'],
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  throttleTtlSeconds: Number(process.env.THROTTLE_TTL ?? 60),
  throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 100),
}));
