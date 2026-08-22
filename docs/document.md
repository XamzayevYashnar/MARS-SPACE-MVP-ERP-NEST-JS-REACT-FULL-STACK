# Mars Space LMS — Backend Technical Specification (Prompt)

> **How to use this file:** paste the whole document into your AI coding agent (Claude Code, Cursor, etc.) as a single prompt, or hand it to a backend developer as a formal TZ. It is self-contained: architecture, data model, API contract, and acceptance criteria are all defined below. This document covers the **backend only**. The frontend has its own separate specification.

---

## 0. Role & Mission

You are a **senior backend engineer** specialising in NestJS, Prisma and PostgreSQL, with strong Domain-Driven Design experience.

Build the **backend of a mini MVP web application for "Mars Space" — an IT training centre**. The system powers a public marketing website (courses, teachers, news, lead capture) and a private admin panel (content management, groups, students, CRM-style lead pipeline).

Deliver **production-grade code**, not a prototype: strict typing, layered architecture, validated inputs, consistent error handling, documented API, seeded database, Docker setup.

### Working rules

1. Follow the folder structure in §4 **exactly**. Do not flatten it, do not invent alternative layering.
2. Every module follows the same four-layer shape: `domain / application / infrastructure / presentation`.
3. `strict: true` in `tsconfig.json`. **No `any`**, no `@ts-ignore`, no non-null assertions to silence the compiler.
4. Controllers contain **zero business logic** — they validate, delegate to a use case, and return a mapped response.
5. Use cases never import `PrismaService` directly — they depend on a repository **interface** (abstract class) injected by token.
6. Never return a raw Prisma entity from a controller. Always map through a response DTO/mapper. Password hashes must never leave the application layer.
7. Write the Prisma schema first, run the migration, then implement modules one by one, in the order given in §14.
8. If a requirement is ambiguous, choose the simplest option that satisfies the acceptance criteria, implement it, and note the decision in `DECISIONS.md`.

---

## 1. Product Context

**Mars Space** is an offline/online IT education centre (Uzbekistan). Its audience is prospective students and their parents, browsing mostly on mobile phones, in **three languages: Uzbek (default), Russian, English**.

### MVP business goals

| # | Goal | Backend responsibility |
|---|------|------------------------|
| 1 | Present the course catalogue attractively | Courses, categories, teachers, syllabus, pricing |
| 2 | Convert visitors into leads | Public lead form + instant Telegram notification to sales |
| 3 | Let staff manage everything without a developer | Full admin CRUD API + role-based access |
| 4 | Track intakes and enrolled students | Groups (intakes), schedule, capacity, students |
| 5 | Publish news / blog for SEO | Posts with slugs, localisation, view counters |

### Explicitly OUT of scope for this MVP

Online payments, video lessons / streaming, homework and grading, attendance tracking, parent accounts, student self-service portal, certificates, push notifications, multi-branch support. Design the schema so these can be added later, but **do not implement them**.

---

## 2. Technology Stack (fixed — do not substitute)

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.x, `strict` mode |
| Framework | NestJS 10 (or latest stable), Express adapter |
| ORM | **Prisma 5.x** |
| Database | **PostgreSQL 16** |
| Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| Config | `@nestjs/config` + Joi schema validation (fail fast on boot) |
| Auth | `@nestjs/jwt` + `passport-jwt`, access + refresh tokens |
| Password hashing | `argon2` (fallback: `bcrypt`, cost 12) |
| Docs | `@nestjs/swagger` → OpenAPI 3 at `/api/docs` |
| Logging | `nestjs-pino` (JSON in prod, pretty in dev, request-id correlation) |
| Rate limiting | `@nestjs/throttler` |
| Security | `helmet`, CORS whitelist, payload size limits |
| Health | `@nestjs/terminus` → `/health` (liveness, no dependencies) and `/health/ready` (DB check) |
| File upload | `multer` → local disk in dev, S3-compatible adapter interface |
| Testing | Jest (unit) + Supertest (e2e) |
| Quality | ESLint (`@typescript-eslint`), Prettier, Husky + lint-staged, Commitlint (Conventional Commits) |
| Container | Docker + docker-compose (api, postgres, pgadmin) |

---

## 3. Architectural Principles

The project uses **pragmatic DDD**: a clean, layered separation without over-engineering an MVP.

```
Presentation  →  Application  →  Domain  ←  Infrastructure
(controllers)    (use cases)     (entities,     (Prisma repo
                                  repo ports)    implementations)
```

- **Domain** — framework-free. Entities, value objects, domain errors, and repository **ports** (abstract classes used as DI tokens). No Prisma, no Nest decorators, no HTTP.
- **Application** — orchestration. One use case = one class = one public `execute()` method. Owns DTOs and mappers. Depends only on domain ports.
- **Infrastructure** — adapters. Prisma repository implementations, external services (Telegram, storage). Implements domain ports.
- **Presentation** — HTTP surface. Controllers, Swagger decorators, guards, route-level throttling.

**Dependency rule:** dependencies point inwards. Domain imports nothing from the other three layers.

**Dependency injection pattern** (use this exact style everywhere):

```ts
// domain/repositories/course.repository.ts
export abstract class CourseRepository {
  abstract findMany(query: CourseQuery): Promise<Paginated<Course>>;
  abstract findBySlug(slug: string): Promise<Course | null>;
  abstract create(data: CreateCourseData): Promise<Course>;
  // ...
}

// course.module.ts
providers: [
  { provide: CourseRepository, useClass: PrismaCourseRepository },
  CreateCourseUseCase,
  // ...
]
```

---

## 4. Folder Structure (mandatory)

```
mars-space-api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/                        # cross-cutting, framework-level helpers
│   │   ├── constants/                 # app.constants.ts, error-codes.ts, regex.ts
│   │   ├── decorators/                # @Public, @Roles, @CurrentUser, @ApiPaginated
│   │   ├── dto/                       # pagination-query.dto.ts, id-param.dto.ts, slug-param.dto.ts
│   │   ├── enums/                     # shared enums (Language, SortOrder)
│   │   ├── exceptions/                # DomainException, EntityNotFoundException, ...
│   │   ├── filters/                   # all-exceptions.filter.ts, prisma-exception.filter.ts
│   │   ├── guards/                    # jwt-auth.guard.ts, roles.guard.ts
│   │   ├── interceptors/              # response-transform, logging, timeout
│   │   ├── interfaces/                # Paginated<T>, LocalizedText, JwtPayload
│   │   ├── pipes/                     # parse-object-id / parse-cuid pipe
│   │   ├── types/
│   │   └── utils/                     # slugify.ts, pagination.util.ts, sanitize-html.ts
│   │
│   ├── core/                          # infrastructure wiring, one-per-app services
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   ├── storage.config.ts
│   │   │   ├── notification.config.ts
│   │   │   └── validation.schema.ts   # Joi env validation
│   │   ├── logger/                    # logger.module.ts (pino config)
│   │   ├── security/                  # hashing.service.ts (argon2 wrapper), token.service.ts
│   │   ├── storage/                   # storage.service.ts (abstract) + local.storage.ts, s3.storage.ts
│   │   ├── notification/              # telegram.notifier.ts (new-lead alerts)
│   │   ├── health/                    # health.controller.ts
│   │   └── core.module.ts             # @Global()
│   │
│   ├── database/
│   │   ├── prisma.service.ts          # extends PrismaClient, onModuleInit/onModuleDestroy
│   │   ├── prisma.module.ts           # @Global()
│   │   ├── base.prisma.repository.ts  # shared pagination/sorting helpers
│   │   └── seeders/                   # admin.seeder.ts, catalog.seeder.ts, demo.seeder.ts
│   │
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── categories/
│       ├── courses/
│       ├── teachers/
│       ├── groups/
│       ├── students/
│       ├── leads/
│       ├── posts/
│       ├── testimonials/
│       ├── contact-messages/
│       ├── settings/
│       ├── uploads/
│       └── statistics/
├── test/                              # e2e specs
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── README.md
└── DECISIONS.md
```

### Internal shape of every module (example: `courses`)

```
modules/courses/
├── domain/
│   ├── entities/course.entity.ts
│   ├── value-objects/course-price.vo.ts        # only where it earns its place
│   ├── repositories/course.repository.ts       # abstract class = DI token
│   └── errors/course-not-found.error.ts
├── application/
│   ├── dto/
│   │   ├── create-course.dto.ts
│   │   ├── update-course.dto.ts
│   │   ├── query-courses.dto.ts
│   │   └── course-response.dto.ts
│   ├── mappers/course.mapper.ts
│   └── use-cases/
│       ├── create-course.use-case.ts
│       ├── update-course.use-case.ts
│       ├── delete-course.use-case.ts
│       ├── get-course-by-slug.use-case.ts
│       └── list-courses.use-case.ts
├── infrastructure/
│   └── persistence/prisma-course.repository.ts
├── presentation/
│   ├── courses.controller.ts                   # public routes
│   └── courses.admin.controller.ts             # /admin routes, guarded
└── courses.module.ts
```

---

## 5. Data Model

### 5.1 Localisation strategy

All user-facing content fields are stored as **JSONB** with the shape:

```ts
type LocalizedText = { uz: string; ru: string; en: string };
```

`uz` is required; `ru` and `en` may be empty strings and fall back to `uz` at read time. Provide a `LocalizedTextDto` with `@ValidateNested()` and reuse it everywhere. Slugs are single-string, Latin, unique, generated from the `uz` title via `slugify` and editable by hand.

### 5.2 Prisma schema

Implement `prisma/schema.prisma` as follows (extend only if strictly necessary; note any change in `DECISIONS.md`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole      { SUPER_ADMIN ADMIN MANAGER }
enum CourseLevel   { BEGINNER INTERMEDIATE ADVANCED }
enum CourseFormat  { OFFLINE ONLINE HYBRID }
enum GroupStatus   { FORMING ACTIVE PAUSED FINISHED CANCELLED }
enum StudentStatus { ACTIVE GRADUATED FROZEN DROPPED }
enum LeadStatus    { NEW IN_PROGRESS CONTACTED ENROLLED REJECTED }
enum LeadSource    { WEBSITE_FORM COURSE_PAGE HERO_FORM TELEGRAM INSTAGRAM PHONE WALK_IN OTHER }
enum WeekDay       { MON TUE WED THU FRI SAT SUN }

model User {
  id            String    @id @default(cuid())
  fullName      String
  email         String    @unique
  phone         String?
  passwordHash  String
  role          UserRole  @default(ADMIN)
  avatarUrl     String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  refreshTokens RefreshToken[]
  assignedLeads Lead[]    @relation("LeadAssignee")
  posts         Post[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([role, isActive])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}

model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        Json     // LocalizedText
  description Json?    // LocalizedText
  iconKey     String?  // icon identifier resolved on the frontend
  colorHex    String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  courses     Course[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive, sortOrder])
  @@map("categories")
}

model Course {
  id               String        @id @default(cuid())
  slug             String        @unique
  title            Json          // LocalizedText
  shortDescription Json          // LocalizedText, max 240 chars per locale
  description      Json          // LocalizedText, rich text (sanitized HTML)
  outcomes         Json?         // { uz: string[], ru: string[], en: string[] }
  requirements     Json?         // same shape as outcomes
  syllabus         Json?         // CourseModule[] — see §5.3
  categoryId       String
  category         Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  level            CourseLevel   @default(BEGINNER)
  format           CourseFormat  @default(OFFLINE)
  durationMonths   Int
  lessonsPerWeek   Int
  lessonMinutes    Int           @default(90)
  price            Decimal       @db.Decimal(12, 2)
  discountPrice    Decimal?      @db.Decimal(12, 2)
  currency         String        @default("UZS")
  coverImageUrl    String?
  promoVideoUrl    String?
  metaTitle        Json?
  metaDescription  Json?
  isFeatured       Boolean       @default(false)
  isPublished      Boolean       @default(false)
  sortOrder        Int           @default(0)
  teachers         CourseTeacher[]
  groups           Group[]
  leads            Lead[]
  testimonials     Testimonial[]
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([categoryId, isPublished])
  @@index([isPublished, isFeatured, sortOrder])
  @@map("courses")
}

model Teacher {
  id              String          @id @default(cuid())
  slug            String          @unique
  fullName        String
  position        Json            // LocalizedText
  bio             Json?           // LocalizedText
  photoUrl        String?
  experienceYears Int             @default(0)
  skills          String[]        @default([])
  socials         Json?           // { telegram?, linkedin?, github?, instagram? }
  sortOrder       Int             @default(0)
  isActive        Boolean         @default(true)
  courses         CourseTeacher[]
  groups          Group[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([isActive, sortOrder])
  @@map("teachers")
}

model CourseTeacher {
  courseId  String
  teacherId String
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@id([courseId, teacherId])
  @@map("course_teachers")
}

model Group {
  id           String      @id @default(cuid())
  name         String      // e.g. "FS-2026-01"
  courseId     String
  course       Course      @relation(fields: [courseId], references: [id], onDelete: Restrict)
  teacherId    String?
  teacher      Teacher?    @relation(fields: [teacherId], references: [id], onDelete: SetNull)
  startDate    DateTime
  endDate      DateTime?
  weekDays     WeekDay[]   @default([])
  startTime    String      // "18:00", validated HH:mm
  endTime      String      // "20:00"
  roomName     String?
  capacity     Int         @default(15)
  status       GroupStatus @default(FORMING)
  students     Student[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@unique([name])
  @@index([courseId, status])
  @@index([status, startDate])
  @@map("groups")
}

model Student {
  id         String        @id @default(cuid())
  fullName   String
  phone      String
  email      String?
  birthDate  DateTime?
  groupId    String?
  group      Group?        @relation(fields: [groupId], references: [id], onDelete: SetNull)
  status     StudentStatus @default(ACTIVE)
  note       String?
  enrolledAt DateTime      @default(now())
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@index([groupId, status])
  @@index([phone])
  @@map("students")
}

model Lead {
  id           String     @id @default(cuid())
  fullName     String
  phone        String
  courseId     String?
  course       Course?    @relation(fields: [courseId], references: [id], onDelete: SetNull)
  message      String?
  source       LeadSource @default(WEBSITE_FORM)
  status       LeadStatus @default(NEW)
  assignedToId String?
  assignedTo   User?      @relation("LeadAssignee", fields: [assignedToId], references: [id], onDelete: SetNull)
  adminNote    String?
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  pageUrl      String?
  contactedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([status, createdAt])
  @@index([courseId])
  @@map("leads")
}

model Post {
  id              String    @id @default(cuid())
  slug            String    @unique
  title           Json      // LocalizedText
  excerpt         Json      // LocalizedText
  content         Json      // LocalizedText, sanitized HTML
  coverImageUrl   String?
  tags            String[]  @default([])
  authorId        String?
  author          User?     @relation(fields: [authorId], references: [id], onDelete: SetNull)
  readMinutes     Int       @default(3)
  viewCount       Int       @default(0)
  metaTitle       Json?
  metaDescription Json?
  isPublished     Boolean   @default(false)
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isPublished, publishedAt])
  @@map("posts")
}

model Testimonial {
  id          String   @id @default(cuid())
  authorName  String
  authorRole  Json?    // LocalizedText, e.g. "Frontend developer at X"
  avatarUrl   String?
  courseId    String?
  course      Course?  @relation(fields: [courseId], references: [id], onDelete: SetNull)
  rating      Int      @default(5)   // 1..5
  content     Json     // LocalizedText
  videoUrl    String?
  isPublished Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isPublished, sortOrder])
  @@map("testimonials")
}

model ContactMessage {
  id        String   @id @default(cuid())
  fullName  String
  email     String?
  phone     String
  subject   String?
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([isRead, createdAt])
  @@map("contact_messages")
}

model Setting {
  id        String   @id @default(cuid())
  key       String   @unique   // "contacts", "socials", "hero_stats", "seo_defaults"
  value     Json
  updatedAt DateTime @updatedAt

  @@map("settings")
}

model MediaFile {
  id           String   @id @default(cuid())
  key          String   @unique      // storage key / relative path
  url          String
  originalName String
  mimeType     String
  sizeBytes    Int
  width        Int?
  height       Int?
  uploadedById String?
  createdAt    DateTime @default(now())

  @@map("media_files")
}
```

### 5.3 Syllabus JSON contract

```ts
type CourseModule = {
  order: number;
  title: LocalizedText;
  durationWeeks: number;
  topics: { uz: string[]; ru: string[]; en: string[] };
};
```

Validate the structure with a nested DTO on write — never trust unvalidated JSON.

---

## 6. API Contract

**Base path:** `/api/v1`. Public routes are unauthenticated. Admin routes live under `/api/v1/admin/*` and require a valid access token.

### 6.1 Uniform response envelope

Implement a global `ResponseTransformInterceptor`:

```jsonc
// success
{
  "success": true,
  "statusCode": 200,
  "data": { },
  "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4, "hasNext": true },
  "timestamp": "2026-08-18T09:12:00.000Z"
}
```

```jsonc
// error — produced by AllExceptionsFilter
{
  "success": false,
  "statusCode": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "phone", "message": "phone must match +998XXXXXXXXX" }]
  },
  "path": "/api/v1/leads",
  "timestamp": "2026-08-18T09:12:00.000Z"
}
```

Error codes to define in `common/constants/error-codes.ts`: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`, `GROUP_CAPACITY_EXCEEDED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `RATE_LIMITED`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE` (a dependency is down — retryable, unlike INTERNAL_ERROR).

Map Prisma errors in a dedicated filter: `P2002 → 409 ALREADY_EXISTS`, `P2025 → 404 NOT_FOUND`, `P2003 → 409 CONFLICT`.

### 6.2 Common query parameters

All list endpoints accept: `page` (default 1), `limit` (default 12, max 100), `search`, `sortBy`, `sortOrder` (`asc|desc`, default `desc` on `createdAt`). Public list endpoints additionally accept `lang` (`uz|ru|en`) — when present, the API returns flattened strings for that locale instead of the full `LocalizedText` object. Admin endpoints always return the full object.

### 6.3 Endpoint table

#### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Email + password → access (15 m) + refresh (7 d, httpOnly cookie **and** body). Throttle 5/min/IP. |
| POST | `/refresh` | refresh token | Rotate refresh token, revoke the used one |
| POST | `/logout` | access | Revoke current refresh token |
| GET | `/me` | access | Current user profile |
| PATCH | `/change-password` | access | Requires `currentPassword`; revokes all other sessions |

#### Public content

| Method | Path | Description |
|---|---|---|
| GET | `/categories` | Active categories, sorted by `sortOrder`, with `coursesCount` |
| GET | `/categories/:slug` | Single category |
| GET | `/courses` | Published courses. Filters: `categorySlug`, `level`, `format`, `isFeatured`, `minPrice`, `maxPrice`, `search`, plus common params |
| GET | `/courses/featured` | Up to 6 featured courses for the home page |
| GET | `/courses/:slug` | Course detail + category + teachers + open groups + published testimonials |
| GET | `/teachers` | Active teachers |
| GET | `/teachers/:slug` | Teacher detail + their published courses |
| GET | `/groups/upcoming` | Groups with `status=FORMING` and `startDate >= today`, incl. `freeSeats` |
| GET | `/posts` | Published posts. Filters: `tag`, `search` |
| GET | `/posts/:slug` | Post detail; increments `viewCount` (fire-and-forget, non-blocking) |
| GET | `/testimonials` | Published testimonials, optional `courseSlug` |
| GET | `/settings` | Public settings bundle (contacts, socials, hero stats, SEO defaults) |
| POST | `/leads` | **Lead capture.** Throttle 3/min/IP. Honeypot field `website` must be empty. Triggers Telegram notification. |
| POST | `/contact` | Contact form. Throttle 3/min/IP. |
| GET | `/health` | Liveness — process is up; touches no dependency |
| GET | `/health/ready` | Readiness — real DB round-trip |

#### Admin — `/api/v1/admin` (JWT + roles)

| Resource | Routes | Min role |
|---|---|---|
| Users | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/status`, `DELETE /users/:id` | SUPER_ADMIN |
| Categories | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder` | ADMIN |
| Courses | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature` | ADMIN |
| Teachers | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder` | ADMIN |
| Groups | `GET` (filters: `courseId`, `teacherId`, `status`), `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id` | MANAGER |
| Students | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/move`, `DELETE /:id` | MANAGER |
| Leads | `GET` (filters: `status`, `courseId`, `assignedToId`, `dateFrom`, `dateTo`), `GET /:id`, `PATCH /:id/status`, `PATCH /:id/assign`, `PATCH /:id/note`, `POST /:id/convert`, `DELETE /:id` | MANAGER |
| Posts | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/publish`, `DELETE /:id` | ADMIN |
| Testimonials | `GET`, `POST`, `PATCH /:id`, `PATCH /:id/publish`, `DELETE /:id` | ADMIN |
| Messages | `GET`, `GET /:id`, `PATCH /:id/read`, `DELETE /:id` | MANAGER |
| Settings | `GET /settings`, `PUT /settings/:key` | ADMIN |
| Uploads | `POST /uploads/image` (multipart, field `file`), `DELETE /uploads/:id` | MANAGER |
| Statistics | `GET /statistics/overview` | MANAGER |

`GET /admin/statistics/overview` returns:

```jsonc
{
  "totals": { "courses": 12, "activeGroups": 7, "students": 143, "leadsThisMonth": 61 },
  "leadsByStatus": { "NEW": 14, "IN_PROGRESS": 9, "CONTACTED": 21, "ENROLLED": 12, "REJECTED": 5 },
  "leadsTrend": [{ "date": "2026-08-01", "count": 4 }],
  "topCourses": [{ "courseId": "...", "title": {}, "leadsCount": 23 }],
  "recentLeads": [ /* last 5 */ ]
}
```

### 6.4 Key business rules

1. **Slug uniqueness** — auto-generate from `title.uz`; on collision append `-2`, `-3`, … Slugs are immutable after publication unless explicitly overridden.
2. **Group capacity** — adding a student to a full group throws `GROUP_CAPACITY_EXCEEDED` (409). Compute `freeSeats = capacity - activeStudentsCount`.
3. **Lead conversion** — `POST /admin/leads/:id/convert` accepts a `groupId`, creates a `Student` inside a transaction, sets lead status to `ENROLLED`, and links nothing else. Idempotent: converting an already-converted lead returns 409.
4. **Publishing** — unpublished courses/posts are invisible on every public endpoint, including direct slug access (404).
5. **Delete safety** — a category with courses, or a course with groups, cannot be hard-deleted (409 `CONFLICT`); instruct the client to deactivate instead.
6. **Phone format** — validate Uzbek numbers with `/^\+998\d{9}$/`; normalise (strip spaces/dashes) before persisting.
7. **HTML sanitisation** — sanitise all rich-text fields server-side (`sanitize-html`) before storage; allow a conservative tag whitelist.
8. **View counter** — `viewCount` increments at most once per IP per post per hour (in-memory LRU is acceptable for MVP).

---

## 7. Security Requirements

- Access token: 15 minutes, signed with `JWT_ACCESS_SECRET`. Payload: `{ sub, email, role, iat, exp }`.
- Refresh token: 7 days, stored **hashed** in `refresh_tokens`, rotated on every refresh, revoked on logout and password change.
- `JwtAuthGuard` registered globally with `APP_GUARD`; opt out per route with `@Public()`.
- `RolesGuard` reads `@Roles(UserRole.ADMIN)` metadata; `SUPER_ADMIN` implicitly passes every check.
- Global rate limit 100 req/min/IP; stricter limits on `/auth/login` (5/min) and public form endpoints (3/min).
- `helmet`, CORS restricted to `CORS_ORIGINS` (comma-separated env), body limit 1 MB (10 MB for the upload route).
- Uploads: allow `image/jpeg|png|webp|svg+xml` only, max 5 MB, validate by magic bytes (not just the declared MIME), regenerate the filename, strip EXIF, never trust `originalName` in paths.
- Never log passwords, tokens, or full request bodies of auth routes. Redact in pino config.
- Seeded default admin credentials must come from env vars and the README must instruct changing them on first login.

---

## 8. Configuration

`.env.example` (fully documented, committed):

```bash
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

DATABASE_URL=postgresql://mars:mars@localhost:5432/mars_space?schema=public

JWT_ACCESS_SECRET=change_me_access
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh
JWT_REFRESH_EXPIRES_IN=7d

STORAGE_DRIVER=local            # local | s3
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:4000/uploads
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

THROTTLE_TTL=60
THROTTLE_LIMIT=100

SEED_ADMIN_EMAIL=admin@marsspace.uz
SEED_ADMIN_PASSWORD=ChangeMe123!
```

Validate every variable with Joi in `core/config/validation.schema.ts`; the app must refuse to boot on invalid config. Access config **only** through typed `ConfigService` getters — never `process.env` outside `core/config`.

---

## 9. Seeding

`prisma/seed.ts` (idempotent, `pnpm db:seed`):

- 1 SUPER_ADMIN from env, 1 MANAGER demo account.
- 5 categories: Frontend, Backend, Mobile, UI/UX Design, Foundation (Computer Literacy).
- 8 courses with realistic Uzbek/Russian/English content, prices in UZS, full 6–10 module syllabi.
- 6 teachers with skills and bios, linked to courses.
- 6 groups (mixed `FORMING` / `ACTIVE`) with schedules.
- 20 students spread across active groups.
- 25 leads with varied statuses and dates across the last 60 days (so the dashboard chart is meaningful).
- 6 published posts, 8 testimonials, and the `contacts` / `socials` / `hero_stats` settings records.

---

## 10. Testing Requirements

- **Unit tests** for every use case containing branching logic, with mocked repository ports. Minimum: auth (login/refresh/rotation), slug generation, group capacity, lead conversion, pagination utility, phone normalisation.
- **E2E tests** (Supertest + a dedicated test database, reset between suites) covering: full auth flow; public course listing with filters + pagination; 404 on an unpublished course slug; lead creation incl. throttling and honeypot; a complete admin CRUD cycle for courses; role rejection (MANAGER hitting an ADMIN route → 403).
- Target ≥ 70 % line coverage on `application/` and `domain/`.
- `pnpm test`, `pnpm test:e2e`, `pnpm test:cov` must all pass on a clean checkout.

---

## 11. Docker & Scripts

`docker-compose.yml` services: `postgres` (16-alpine, named volume, healthcheck), `api` (multi-stage Dockerfile, depends on healthy postgres), `pgadmin` (optional, profile `tools`). `docker compose up` must yield a working API with a migrated, seeded database.

`package.json` scripts: `dev`, `build`, `start:prod`, `db:generate`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`, `db:reset`, `lint`, `format`, `test`, `test:e2e`, `test:cov`.

---

## 12. Documentation Deliverables

1. **README.md** — stack overview, architecture diagram (ASCII is fine), prerequisites, local setup in ≤ 5 commands, Docker setup, env table, scripts table, folder-structure explanation, "how to add a new module" walkthrough.
2. **Swagger** at `/api/docs` — every endpoint tagged and grouped (`Public / Auth / Admin: Courses / …`), every DTO annotated with `@ApiProperty` incl. examples, bearer auth configured, response envelope documented via a generic `ApiOkResponsePaginated` decorator.
3. **DECISIONS.md** — short log of any deviation from this TZ and why.
4. **`docs/api-collection.json`** — exported Postman/Insomnia collection with environment variables.

---

## 13. Definition of Done (acceptance criteria)

- [ ] `docker compose up` starts the API; `/health/ready` returns 200 with DB connected.
- [ ] Prisma migrations apply to an empty database with no manual SQL.
- [ ] `pnpm db:seed` populates realistic demo data and is safe to run twice.
- [ ] Every endpoint in §6.3 exists, is documented in Swagger, and returns the §6.1 envelope.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass with zero errors and zero `any`.
- [ ] Folder structure matches §4 exactly; every module has the four-layer shape.
- [ ] No use case imports `PrismaService`; all data access goes through repository ports.
- [ ] Password hashes, refresh tokens, and internal fields never appear in an HTTP response.
- [ ] Public endpoints return no unpublished content under any parameter combination.
- [ ] Role guards verified: MANAGER cannot reach ADMIN-only routes, ADMIN cannot reach SUPER_ADMIN-only routes.
- [ ] Rate limiting demonstrably active on `/auth/login` and `/leads`.
- [ ] A new lead posts a formatted Telegram message (or logs a clear warning when the token is absent — it must never break the request).

---

## 14. Build Order

Work in these commits, verifying each stage before moving on:

1. Scaffold Nest project, tsconfig strict, ESLint/Prettier/Husky, folder skeleton.
2. `core/config` + Joi validation + logger + `PrismaModule` + `/health`.
3. `prisma/schema.prisma`, first migration, `prisma/seed.ts` (admin only).
4. `common/` layer: filters, interceptors, decorators, pagination DTO/util, error codes.
5. `auth` + `users` modules (full flow, unit + e2e tests).
6. `categories` → `courses` → `teachers` (public + admin controllers).
7. `groups` → `students` (capacity rules).
8. `leads` (+ Telegram notifier) → `contact-messages`.
9. `posts` → `testimonials` → `settings` → `uploads`.
10. `statistics` module.
11. Full seed data, Swagger polish, e2e suite, Docker, README, DECISIONS.

---

## 15. Output Format

For each stage, output complete file contents with their full paths — no `// ...rest unchanged` placeholders in new files. After every stage, give a one-paragraph summary of what was built and the exact commands to verify it.
