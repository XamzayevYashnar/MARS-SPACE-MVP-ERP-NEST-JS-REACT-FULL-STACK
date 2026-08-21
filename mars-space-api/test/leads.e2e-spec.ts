import { INestApplication } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { SeededFixtures, seedFixtures, TEST_PASSWORD } from './fixtures';
import { createTestApp, resetDatabase, resetThrottler } from './test-app';

describe('Lead capture and pipeline (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: string;
  let fixtures: SeededFixtures;
  let managerToken: string;

  beforeAll(async () => {
    ({ app, prisma, api } = await createTestApp());
    await resetDatabase(prisma);
    fixtures = await seedFixtures(prisma);

    const login = await request(app.getHttpServer())
      .post(`${api}/auth/login`)
      .send({ email: 'e2e-manager@marsspace.uz', password: TEST_PASSWORD })
      .expect(200);

    managerToken = login.body.data.accessToken;
  });

  beforeEach(() => {
    resetThrottler(app);
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  const postLead = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post(`${api}/leads`).send(body);

  const asManager = (method: 'get' | 'post' | 'patch' | 'delete', path: string) =>
    request(app.getHttpServer())
      [method](`${api}${path}`)
      .set('Authorization', `Bearer ${managerToken}`);

  describe('POST /leads', () => {
    it('accepts a lead and answers without exposing the stored record', async () => {
      const response = await postLead({
        fullName: 'Ulugbek Ismatullayev',
        phone: '+998901234567',
        message: 'Kurs narxi qiziqtiryapti',
      }).expect(201);

      expect(response.body.data).toEqual({
        accepted: true,
        message: expect.any(String),
      });
      expect(response.body.data).not.toHaveProperty('id');
    });

    it('normalises a loosely formatted phone number', async () => {
      await postLead({ fullName: 'Formatlangan', phone: '90 111 22 33' }).expect(201);

      const lead = await prisma.lead.findFirst({ where: { fullName: 'Formatlangan' } });
      expect(lead?.phone).toBe('+998901112233');
    });

    it('rejects an unusable phone number with a 422', async () => {
      const response = await postLead({ fullName: 'Yomon raqam', phone: '12345' }).expect(422);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: [{ field: 'phone' }],
      });
    });

    it('silently discards a submission that filled the honeypot', async () => {
      const before = await prisma.lead.count();

      const response = await postLead({
        fullName: 'Bot',
        phone: '+998901234567',
        website: 'http://spam.example',
      }).expect(201);

      // The bot sees the same acknowledgement a human does...
      expect(response.body.data.accepted).toBe(true);
      // ...but nothing is stored.
      expect(await prisma.lead.count()).toBe(before);
    });

    it('strips markup out of the free-text fields', async () => {
      await postLead({
        fullName: '<b>Tozalangan</b>',
        phone: '+998901239999',
        message: '<script>alert(1)</script>Salom',
      }).expect(201);

      const lead = await prisma.lead.findFirst({ where: { phone: '+998901239999' } });
      expect(lead?.fullName).toBe('Tozalangan');
      expect(lead?.message).toBe('Salom');
    });

    it('rejects an unknown field rather than silently ignoring it', async () => {
      await postLead({
        fullName: 'Test',
        phone: '+998901234567',
        isAdmin: true,
      }).expect(422);
    });
  });

  describe('rate limiting', () => {
    it('allows three lead submissions per minute and then returns 429 RATE_LIMITED', async () => {
      resetThrottler(app);

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await postLead({ fullName: `Throttle ${attempt}`, phone: '+998901234567' }).expect(201);
      }

      const blocked = await postLead({ fullName: 'Throttle 4', phone: '+998901234567' }).expect(
        429,
      );

      expect(blocked.body).toMatchObject({
        success: false,
        statusCode: 429,
        error: { code: 'RATE_LIMITED' },
      });
    });

    it('allows five login attempts per minute and then returns 429', async () => {
      resetThrottler(app);

      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await request(app.getHttpServer())
          .post(`${api}/auth/login`)
          .send({ email: 'nobody@marsspace.uz', password: 'WrongPass1' })
          .expect(401);
      }

      await request(app.getHttpServer())
        .post(`${api}/auth/login`)
        .send({ email: 'nobody@marsspace.uz', password: 'WrongPass1' })
        .expect(429);
    });
  });

  describe('admin pipeline', () => {
    it('lists captured leads for a MANAGER', async () => {
      const response = await asManager('get', '/admin/leads').expect(200);

      expect(response.body.meta.total).toBeGreaterThan(0);
    });

    it('moves a lead through statuses and stamps contactedAt on first contact', async () => {
      const lead = await prisma.lead.create({
        data: { fullName: 'Pipeline', phone: '+998905551111' },
      });

      const response = await asManager('patch', `/admin/leads/${lead.id}/status`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.contactedAt).not.toBeNull();
    });

    it('refuses to set ENROLLED by hand, pointing at the convert endpoint', async () => {
      const lead = await prisma.lead.create({
        data: { fullName: 'Manual enrol', phone: '+998905552222' },
      });

      const response = await asManager('patch', `/admin/leads/${lead.id}/status`)
        .send({ status: 'ENROLLED' })
        .expect(409);

      expect(response.body.error.message).toContain('convert');
    });

    it('assigns and unassigns a lead', async () => {
      const lead = await prisma.lead.create({
        data: { fullName: 'Assignable', phone: '+998905553333' },
      });

      const assigned = await asManager('patch', `/admin/leads/${lead.id}/assign`)
        .send({ assignedToId: fixtures.managerId })
        .expect(200);
      expect(assigned.body.data.assignedTo).toMatchObject({ id: fixtures.managerId });

      const unassigned = await asManager('patch', `/admin/leads/${lead.id}/assign`)
        .send({ assignedToId: null })
        .expect(200);
      expect(unassigned.body.data.assignedTo).toBeNull();
    });
  });

  describe('lead conversion', () => {
    it('creates a student, flips the lead to ENROLLED, and refuses a second attempt', async () => {
      const lead = await prisma.lead.create({
        data: { fullName: 'Konvertatsiya', phone: '+998905554444' },
      });
      const group = await prisma.group.create({
        data: {
          name: 'E2E-CONV-1',
          courseId: fixtures.publishedCourseId,
          startDate: new Date('2026-09-01'),
          startTime: '18:00',
          endTime: '19:30',
          capacity: 5,
          status: GroupStatus.FORMING,
        },
      });

      const converted = await asManager('post', `/admin/leads/${lead.id}/convert`)
        .send({ groupId: group.id, note: 'Bo‘lib to‘laydi' })
        .expect(201);

      expect(converted.body.data.lead.status).toBe('ENROLLED');
      expect(converted.body.data.studentId).toEqual(expect.any(String));

      const student = await prisma.student.findUnique({
        where: { id: converted.body.data.studentId },
      });
      expect(student).toMatchObject({
        fullName: 'Konvertatsiya',
        phone: '+998905554444',
        groupId: group.id,
      });

      // Converting again must not produce a second student.
      const again = await asManager('post', `/admin/leads/${lead.id}/convert`)
        .send({ groupId: group.id })
        .expect(409);
      expect(again.body.error.code).toBe('CONFLICT');
      expect(await prisma.student.count({ where: { phone: '+998905554444' } })).toBe(1);
    });

    it('refuses to convert into a full group with GROUP_CAPACITY_EXCEEDED', async () => {
      const lead = await prisma.lead.create({
        data: { fullName: 'Toʻla guruh', phone: '+998905555555' },
      });
      const group = await prisma.group.create({
        data: {
          name: 'E2E-FULL-1',
          courseId: fixtures.publishedCourseId,
          startDate: new Date('2026-09-01'),
          startTime: '18:00',
          endTime: '19:30',
          capacity: 1,
          status: GroupStatus.FORMING,
          students: { create: { fullName: 'Occupant', phone: '+998905556666' } },
        },
      });

      const response = await asManager('post', `/admin/leads/${lead.id}/convert`)
        .send({ groupId: group.id })
        .expect(409);

      expect(response.body.error.code).toBe('GROUP_CAPACITY_EXCEEDED');
      expect(await prisma.lead.findUnique({ where: { id: lead.id } })).toMatchObject({
        status: 'NEW',
      });
    });
  });
});
