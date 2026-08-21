import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { seedFixtures, TEST_PASSWORD } from './fixtures';
import { createTestApp, resetDatabase, resetThrottler } from './test-app';

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: string;

  beforeAll(async () => {
    ({ app, prisma, api } = await createTestApp());
    await resetDatabase(prisma);
    await seedFixtures(prisma);
  });

  // The login route is rate limited to 5/min; the limit itself is asserted in
  // rate-limit.e2e-spec.ts, so here it is cleared between cases.
  beforeEach(() => {
    resetThrottler(app);
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  const login = (email: string, password = TEST_PASSWORD) =>
    request(app.getHttpServer()).post(`${api}/auth/login`).send({ email, password });

  describe('POST /auth/login', () => {
    it('returns the envelope with a token pair and the profile', async () => {
      const response = await login('e2e-admin@marsspace.uz').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          tokenType: 'Bearer',
          user: { email: 'e2e-admin@marsspace.uz', role: 'ADMIN' },
        },
      });
      expect(response.body.timestamp).toEqual(expect.any(String));
    });

    it('never leaks the password hash', async () => {
      const response = await login('e2e-admin@marsspace.uz').expect(200);

      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
      expect(JSON.stringify(response.body)).not.toContain('argon2');
    });

    it('sets the refresh token as an httpOnly cookie', async () => {
      const response = await login('e2e-admin@marsspace.uz').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((cookie) => cookie.startsWith('mars_refresh_token='))).toBe(true);
      expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);
    });

    it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
      const response = await login('e2e-admin@marsspace.uz', 'WrongPass123!').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'INVALID_CREDENTIALS' },
      });
    });

    it('gives an unknown email the same answer as a wrong password', async () => {
      const response = await login('nobody@marsspace.uz').expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects a malformed body with a 422 and per-field details', async () => {
      const response = await request(app.getHttpServer())
        .post(`${api}/auth/login`)
        .send({ email: 'not-an-email', password: '' })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 422,
        error: { code: 'VALIDATION_ERROR', details: expect.any(Array) },
      });
    });
  });

  describe('GET /auth/me', () => {
    it('returns the current profile for a valid token', async () => {
      const { body } = await login('e2e-manager@marsspace.uz').expect(200);

      const response = await request(app.getHttpServer())
        .get(`${api}/auth/me`)
        .set('Authorization', `Bearer ${body.data.accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        email: 'e2e-manager@marsspace.uz',
        role: 'MANAGER',
      });
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('401s without a token', async () => {
      const response = await request(app.getHttpServer()).get(`${api}/auth/me`).expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('401s on a garbage token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/auth/me`)
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the pair and invalidates the old refresh token', async () => {
      const { body: loginBody } = await login('e2e-admin@marsspace.uz').expect(200);
      const original = loginBody.data.refreshToken;

      const rotated = await request(app.getHttpServer())
        .post(`${api}/auth/refresh`)
        .send({ refreshToken: original })
        .expect(200);

      expect(rotated.body.data.refreshToken).not.toBe(original);

      // Replaying the consumed token must fail — that is what rotation buys.
      const replay = await request(app.getHttpServer())
        .post(`${api}/auth/refresh`)
        .send({ refreshToken: original })
        .expect(401);

      expect(replay.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('401s when no refresh token is supplied at all', async () => {
      await request(app.getHttpServer()).post(`${api}/auth/refresh`).send({}).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the presented session', async () => {
      const { body } = await login('e2e-admin@marsspace.uz').expect(200);

      await request(app.getHttpServer())
        .post(`${api}/auth/logout`)
        .set('Authorization', `Bearer ${body.data.accessToken}`)
        .send({ refreshToken: body.data.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${api}/auth/refresh`)
        .send({ refreshToken: body.data.refreshToken })
        .expect(401);
    });
  });

  describe('PATCH /auth/change-password', () => {
    it('changes the password and revokes the other sessions', async () => {
      const first = await login('e2e-super@marsspace.uz').expect(200);
      const second = await login('e2e-super@marsspace.uz').expect(200);

      await request(app.getHttpServer())
        .patch(`${api}/auth/change-password`)
        .set('Authorization', `Bearer ${second.body.data.accessToken}`)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'BrandNewPass1' })
        .expect(200);

      // The other session's refresh token is dead...
      await request(app.getHttpServer())
        .post(`${api}/auth/refresh`)
        .send({ refreshToken: first.body.data.refreshToken })
        .expect(401);

      // ...the old password no longer works...
      await login('e2e-super@marsspace.uz').expect(401);

      // ...and the new one does.
      await login('e2e-super@marsspace.uz', 'BrandNewPass1').expect(200);
    });

    it('rejects a wrong current password', async () => {
      const { body } = await login('e2e-manager@marsspace.uz').expect(200);

      const response = await request(app.getHttpServer())
        .patch(`${api}/auth/change-password`)
        .set('Authorization', `Bearer ${body.data.accessToken}`)
        .send({ currentPassword: 'NotMyPassword1', newPassword: 'AnotherPass1' })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects a weak new password with a 422', async () => {
      const { body } = await login('e2e-manager@marsspace.uz').expect(200);

      await request(app.getHttpServer())
        .patch(`${api}/auth/change-password`)
        .set('Authorization', `Bearer ${body.data.accessToken}`)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'short' })
        .expect(422);
    });
  });
});
