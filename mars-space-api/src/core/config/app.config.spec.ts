import { appConfig, type AppConfig } from './app.config';

/** `registerAs` returns the factory itself, so it can be invoked directly. */
function load(env: Record<string, string | undefined>): AppConfig {
  const saved = { ...process.env };
  try {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    // `registerAs` widens the return type to allow async factories; this one
    // is synchronous.
    return appConfig() as AppConfig;
  } finally {
    process.env = saved;
  }
}

describe('appConfig', () => {
  describe('swaggerEnabled', () => {
    // `/api/docs` lists every admin route and its payloads, so production has
    // to ask for it; development gets it without ceremony.
    it('is on in development when nothing is set', () => {
      expect(load({ NODE_ENV: 'development', SWAGGER_ENABLED: undefined }).swaggerEnabled).toBe(
        true,
      );
    });

    it('is off in production when nothing is set', () => {
      expect(load({ NODE_ENV: 'production', SWAGGER_ENABLED: undefined }).swaggerEnabled).toBe(
        false,
      );
    });

    it('can be switched off in development', () => {
      expect(load({ NODE_ENV: 'development', SWAGGER_ENABLED: 'false' }).swaggerEnabled).toBe(
        false,
      );
    });

    it('can be opted into in production', () => {
      expect(load({ NODE_ENV: 'production', SWAGGER_ENABLED: 'true' }).swaggerEnabled).toBe(true);
    });
  });

  describe('corsOrigins', () => {
    it('splits and trims the comma-separated list', () => {
      const config = load({
        NODE_ENV: 'development',
        CORS_ORIGINS: 'http://localhost:5173, https://marsspace.uz ',
      });

      expect(config.corsOrigins).toEqual(['http://localhost:5173', 'https://marsspace.uz']);
    });

    // An empty list makes `enableCors` refuse every browser origin, which is
    // the safe reading of "not configured".
    it('is empty rather than [""] when unset', () => {
      expect(load({ NODE_ENV: 'development', CORS_ORIGINS: '' }).corsOrigins).toEqual([]);
    });
  });
});
