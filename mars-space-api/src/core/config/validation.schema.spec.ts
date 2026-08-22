import { validationSchema } from './validation.schema';

const BASE = {
  DATABASE_URL: 'postgresql://mars:mars@localhost:5432/mars_space?schema=public',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

function validate(overrides: Record<string, string>) {
  return validationSchema.validate(
    { ...BASE, ...overrides },
    { abortEarly: false, allowUnknown: true },
  );
}

const STRONG_ACCESS = 'a'.repeat(48);
const STRONG_REFRESH = 'b'.repeat(48);

describe('validationSchema', () => {
  describe('outside production', () => {
    it('accepts the 16-character secrets used in development', () => {
      const { error } = validate({
        NODE_ENV: 'development',
        JWT_ACCESS_SECRET: 'x'.repeat(16),
        JWT_REFRESH_SECRET: 'y'.repeat(16),
      });

      expect(error).toBeUndefined();
    });

    it('still rejects a refresh secret that matches the access secret', () => {
      const { error } = validate({
        NODE_ENV: 'development',
        JWT_ACCESS_SECRET: 'x'.repeat(16),
        JWT_REFRESH_SECRET: 'x'.repeat(16),
      });

      expect(error?.message).toContain('must differ');
    });
  });

  describe('in production', () => {
    it('accepts long, distinct, non-placeholder secrets', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: STRONG_ACCESS,
        JWT_REFRESH_SECRET: STRONG_REFRESH,
      });

      expect(error).toBeUndefined();
    });

    it('rejects a secret short enough to be brute-forced', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'x'.repeat(16),
        JWT_REFRESH_SECRET: STRONG_REFRESH,
      });

      expect(error?.message).toContain('at least 32 characters');
    });

    // The compose file defaults to these, so a deployment that never set the
    // variables would otherwise sign tokens with a key published in this repo.
    it.each([
      ['docker_access_secret_change_me_32', 'docker_refresh_secret_change_me_32'],
      ['dev_access_secret_change_me_please_32', 'dev_refresh_secret_change_me_please_32'],
    ])('rejects the committed placeholder pair %s', (access, refresh) => {
      const { error } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: access,
        JWT_REFRESH_SECRET: refresh,
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('example secrets');
    });

    it('rejects a refresh secret identical to the access secret', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: STRONG_ACCESS,
        JWT_REFRESH_SECRET: STRONG_ACCESS,
      });

      expect(error?.message).toContain('must differ');
    });
  });

  describe('storage driver', () => {
    const DEV = {
      NODE_ENV: 'development',
      JWT_ACCESS_SECRET: 'x'.repeat(16),
      JWT_REFRESH_SECRET: 'y'.repeat(16),
    };

    // Regression: the s3 condition used to match an *absent* STORAGE_DRIVER
    // too, so a deployment relying on the documented `local` default failed
    // boot demanding four S3 variables it had no reason to set.
    it('boots with STORAGE_DRIVER omitted and defaults it to local', () => {
      const { error, value } = validate(DEV);

      expect(error).toBeUndefined();
      expect(value.STORAGE_DRIVER).toBe('local');
    });

    it('boots with STORAGE_DRIVER=local and no S3 credentials', () => {
      const { error } = validate({ ...DEV, STORAGE_DRIVER: 'local' });

      expect(error).toBeUndefined();
    });

    it('demands S3 credentials once the s3 driver is selected', () => {
      const { error } = validate({ ...DEV, STORAGE_DRIVER: 's3' });

      expect(error?.message).toContain('S3_BUCKET');
    });

    it('accepts the s3 driver when its credentials are supplied', () => {
      const { error } = validate({
        ...DEV,
        STORAGE_DRIVER: 's3',
        S3_ENDPOINT: 'https://s3.example.com',
        S3_BUCKET: 'mars-space',
        S3_ACCESS_KEY: 'key',
        S3_SECRET_KEY: 'secret',
      });

      expect(error).toBeUndefined();
    });
  });

  describe('swagger', () => {
    // The schema must leave this alone: ConfigModule copies validated values
    // back into process.env, so a default here would read as an explicit
    // choice and override the per-environment logic in appConfig.
    it('leaves SWAGGER_ENABLED undefined when it was not set', () => {
      const { value } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: STRONG_ACCESS,
        JWT_REFRESH_SECRET: STRONG_REFRESH,
      });

      expect(value.SWAGGER_ENABLED).toBeUndefined();
    });

    it('rejects a value that is neither true nor false', () => {
      const { error } = validate({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: STRONG_ACCESS,
        JWT_REFRESH_SECRET: STRONG_REFRESH,
        SWAGGER_ENABLED: 'yes',
      });

      expect(error?.message).toContain('SWAGGER_ENABLED');
    });
  });
});
