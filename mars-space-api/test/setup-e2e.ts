import { config as loadEnv } from 'dotenv';

/**
 * Loads `.env.test` before any module reads configuration.
 *
 * The e2e suite runs against a dedicated database (`mars_space_test`), so the
 * developer database is never truncated by a test run.
 */
loadEnv({ path: '.env.test' });

process.env.NODE_ENV = 'test';
