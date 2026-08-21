# Mars Space LMS — Backend API

Backend for **Mars Space**, an IT training centre in Uzbekistan. It powers a
public marketing site (courses, teachers, news, lead capture) and a private
admin panel (content management, intakes, students, a CRM-style lead pipeline).

Built with NestJS 10, Prisma 5 and PostgreSQL 16, in a pragmatic
domain-driven layout: every feature module separates `domain`, `application`,
`infrastructure` and `presentation`.

---

## Contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Docker](#docker)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [API surface](#api-surface)
- [Response envelope](#response-envelope)
- [Testing](#testing)
- [Adding a new module](#adding-a-new-module)
- [Security notes](#security-notes)

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.7, `strict` |
| Framework | NestJS 10 (Express adapter) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Validation | `class-validator` + `class-transformer` |
| Config | `@nestjs/config` + Joi (fails fast on boot) |
| Auth | `@nestjs/jwt` + `passport-jwt`, access + rotating refresh tokens |
| Hashing | `argon2` (argon2id) |
| Docs | `@nestjs/swagger` → OpenAPI 3 at `/api/docs` |
| Logging | `nestjs-pino` (JSON in prod, pretty in dev, request-id correlation) |
| Rate limiting | `@nestjs/throttler` |
| Security | `helmet`, CORS whitelist, body-size limits |
| Health | `@nestjs/terminus` → `/health` |
| Uploads | `multer` (memory) → local disk, S3 adapter interface |
| Testing | Jest (unit) + Supertest (e2e) |
| Quality | ESLint, Prettier, Husky, lint-staged, Commitlint |

---

## Architecture

Dependencies point inwards. The domain layer holds no ORM types, DI wiring or
HTTP objects — its only outward imports are the enum *values* generated from the
Prisma schema and `HttpStatus`, both plain constants (see DECISIONS.md §22).

```
        ┌──────────────────────────────────────────────┐
        │              Presentation                    │
        │  controllers · guards · Swagger decorators   │
        └───────────────────┬──────────────────────────┘
                            │ delegates to
                            ▼
        ┌──────────────────────────────────────────────┐
        │              Application                     │
        │  use cases · DTOs · mappers                  │
        └───────────────────┬──────────────────────────┘
                            │ depends on ports
                            ▼
        ┌──────────────────────────────────────────────┐
        │                Domain                        │
        │  entities · value objects · repository ports │
        │  (no ORM types, no DI, no HTTP)              │
        └───────────────────▲──────────────────────────┘
                            │ implements ports
        ┌───────────────────┴──────────────────────────┐
        │             Infrastructure                   │
        │  Prisma repositories · Telegram · storage    │
        └──────────────────────────────────────────────┘
```

Three rules hold everywhere:

1. **Controllers contain no business logic.** They validate, call one use case,
   and return its result.
2. **Use cases never import `PrismaService`.** They depend on an abstract
   repository class, which doubles as the DI token:

   ```ts
   // courses.module.ts
   providers: [{ provide: CourseRepository, useClass: PrismaCourseRepository }]
   ```

3. **No Prisma entity reaches an HTTP response.** Everything passes through a
   mapper, so a new column cannot leak by default.

---

## Quick start

Prerequisites: **Node.js 20+**, **pnpm 9+**, and either Docker or a local
PostgreSQL 16.

```bash
pnpm install                       # 1. dependencies
cp .env.example .env               # 2. configuration (edit the JWT secrets)
docker compose up -d postgres      # 3. database on host port 5433
pnpm db:migrate                    # 4. schema
pnpm db:seed                       # 5. demo content
pnpm dev                           # 6. http://localhost:4000
```

Then open:

- **Swagger UI** — <http://localhost:4000/api/docs>
- **Health** — <http://localhost:4000/health>
- **API base** — <http://localhost:4000/api/v1>

Seeded accounts (from `SEED_*` in `.env`):

| Role | Email | Password |
|---|---|---|
| SUPER_ADMIN | `admin@marsspace.uz` | `ChangeMe123!` |
| MANAGER | `manager@marsspace.uz` | `ChangeMe123!` |

> **Change both passwords on first login** via `PATCH /api/v1/auth/change-password`.
> They come from environment variables and are intended for local development only.

If the repository is a monorepo (the API in `mars-space-api/`), install the git
hooks once with `pnpm hooks:install`.

---

## Docker

```bash
docker compose up --build          # postgres + api, migrated and seeded
docker compose --profile tools up  # ...plus pgAdmin on :5050
docker compose down -v             # stop and drop the volumes
```

The `api` container runs `prisma migrate deploy`, then the compiled seeder, then
the server — so a single `docker compose up` yields a working API with content.

| Service | Host port | Notes |
|---|---|---|
| `api` | 4000 | Waits for a healthy database |
| `postgres` | **5433** | Mapped off 5432 to avoid colliding with a local install |
| `pgadmin` | 5050 | Only with `--profile tools` |

---

## Environment variables

Every variable is validated by Joi on boot; an invalid configuration stops the
process with the full list of problems rather than failing later at a call site.

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `4000` | HTTP port |
| `API_PREFIX` | `api/v1` | Global route prefix |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins |
| `LOG_LEVEL` | `info` | pino level |
| `DATABASE_URL` | — | **Required.** PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | **Required**, min 16 chars |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | — | **Required**, must differ from the access secret |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime |
| `STORAGE_DRIVER` | `local` | `local` \| `s3` |
| `STORAGE_LOCAL_PATH` | `./uploads` | Disk location for the local driver |
| `STORAGE_PUBLIC_URL` | `http://localhost:4000/uploads` | Public base URL for files |
| `STORAGE_MAX_FILE_SIZE` | `5242880` | Max upload size in bytes |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | — | Required only when `STORAGE_DRIVER=s3` |
| `TELEGRAM_BOT_TOKEN` | — | Optional; empty disables alerts with a warning |
| `TELEGRAM_CHAT_ID` | — | Optional; sales chat that receives new leads |
| `THROTTLE_TTL` | `60` | Global rate-limit window, seconds |
| `THROTTLE_LIMIT` | `100` | Requests per window per IP |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@marsspace.uz` / `ChangeMe123!` | Seeded SUPER_ADMIN |
| `SEED_MANAGER_EMAIL` / `SEED_MANAGER_PASSWORD` | `manager@marsspace.uz` / `ChangeMe123!` | Seeded MANAGER |

Configuration is read only through typed `ConfigService` getters;
`process.env` is never touched outside `src/core/config`.

---

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start in watch mode |
| `pnpm build` | Compile to `dist/` |
| `pnpm start:prod` | Run the compiled server |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:migrate` | Create and apply a migration (development) |
| `pnpm db:deploy` | Apply pending migrations (production) |
| `pnpm db:seed` | Seed demo content — safe to run repeatedly |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Drop, re-migrate and re-seed |
| `pnpm lint` | ESLint with `--fix` |
| `pnpm lint:check` | ESLint without writing |
| `pnpm format` | Prettier |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage |
| `pnpm test:e2e` | End-to-end tests (needs the test database) |
| `pnpm docs:collection` | Regenerate `docs/api-collection.json` from Swagger |
| `pnpm hooks:install` | Install the git hooks from the repository root |

---

## Project layout

```
mars-space-api/
├── prisma/
│   ├── schema.prisma           # single source of truth for the data model
│   ├── migrations/
│   └── seed.ts                 # idempotent seeder entry point
├── src/
│   ├── main.ts                 # bootstrap: prefix, helmet, CORS, pipes, Swagger
│   ├── app.module.ts           # composition root and global providers
│   │
│   ├── common/                 # cross-cutting, framework-level helpers
│   │   ├── constants/          # error codes, throttle budgets, regexes
│   │   ├── decorators/         # @Public, @Roles, @CurrentUser, Swagger envelopes
│   │   ├── dto/                # pagination, params, LocalizedText, reorder
│   │   ├── enums/              # Language, SortOrder, role ranks
│   │   ├── exceptions/         # DomainException and its subclasses
│   │   ├── filters/            # AllExceptionsFilter, PrismaExceptionFilter
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/       # response envelope, timeout
│   │   ├── interfaces/         # Paginated<T>, LocalizedText, JwtPayload
│   │   └── utils/              # slugify, phone, sanitize-html, pagination
│   │
│   ├── core/                   # one-per-app infrastructure
│   │   ├── config/             # typed config + Joi validation schema
│   │   ├── logger/             # pino, with redaction of credentials
│   │   ├── security/           # HashingService (argon2), TokenService (JWT)
│   │   ├── storage/            # StorageService port + local and s3 drivers
│   │   ├── notification/       # TelegramNotifier
│   │   ├── health/             # /health with a real database round-trip
│   │   └── core.module.ts      # @Global()
│   │
│   ├── database/
│   │   ├── prisma.service.ts   # the single PrismaClient
│   │   ├── base.prisma.repository.ts
│   │   └── seeders/            # admin, catalogue, demo content
│   │
│   └── modules/                # one folder per feature, four layers each
│       ├── auth/  users/  categories/  courses/  teachers/
│       ├── groups/  students/  leads/  posts/  testimonials/
│       └── contact-messages/  settings/  uploads/  statistics/
├── test/                       # e2e specs, fixtures, app bootstrap
├── docs/api-collection.json    # Postman / Insomnia collection
├── docker-compose.yml
├── Dockerfile
└── DECISIONS.md                # deviations from the specification, with reasons
```

Every feature module has the same internal shape:

```
modules/courses/
├── domain/            entities · value objects · repository port · errors
├── application/       dto · mappers · use-cases (one class, one execute())
├── infrastructure/    Prisma repository implementing the port
├── presentation/      public controller + admin controller
└── courses.module.ts  wires the port to its implementation
```

---

## API surface

Base path `/api/v1`. Public routes need no authentication; admin routes live
under `/api/v1/admin/*` and require a bearer access token. Full request and
response schemas are in Swagger at `/api/docs`.

### Auth — `/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/login` | — | Returns access (15 m) + refresh (7 d, body **and** httpOnly cookie). 5 req/min/IP |
| POST | `/refresh` | refresh token | Rotates the token and revokes the used one |
| POST | `/logout` | access | Revokes the presented session |
| GET | `/me` | access | Current profile, read fresh from the database |
| PATCH | `/change-password` | access | Requires `currentPassword`; revokes all other sessions |

### Public content

| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | Active categories by `sortOrder`, with `coursesCount` |
| GET | `/categories/:slug` | Single active category |
| GET | `/courses` | Published only. Filters: `categorySlug`, `level`, `format`, `isFeatured`, `minPrice`, `maxPrice`, `search` |
| GET | `/courses/featured` | Up to 6 featured courses |
| GET | `/courses/:slug` | Detail + category, teachers, open groups with `freeSeats`, published reviews |
| GET | `/teachers` | Active teachers |
| GET | `/teachers/:slug` | Teacher + their published courses |
| GET | `/groups/upcoming` | `FORMING` intakes starting today or later, with `freeSeats` |
| GET | `/posts` | Published posts. Filters: `tag`, `search` |
| GET | `/posts/:slug` | Detail; bumps `viewCount` once per IP per hour, off the response path |
| GET | `/testimonials` | Published reviews, optional `courseSlug` |
| GET | `/settings` | Public bundle: contacts, socials, hero stats, SEO defaults |
| POST | `/leads` | Lead capture. 3 req/min/IP, honeypot field `website`, Telegram alert |
| POST | `/contact` | Contact form. 3 req/min/IP, same honeypot |
| GET | `/health` | Liveness + database + memory |

All list endpoints accept `page`, `limit` (max 100), `search`, `sortBy`,
`sortOrder`. Public list endpoints also accept `lang` (`uz` \| `ru` \| `en`),
which flattens localised fields to plain strings for that locale, falling back
to `uz`. Admin endpoints always return the full `LocalizedText` object.

### Admin — `/admin`

| Resource | Routes | Min role |
|---|---|---|
| Users | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id` | SUPER_ADMIN |
| Categories | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder` | ADMIN |
| Courses | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature` | ADMIN |
| Teachers | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder` | ADMIN |
| Groups | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id` | MANAGER |
| Students | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/move`, `DELETE /:id` | MANAGER |
| Leads | `GET`, `GET /:id`, `PATCH /:id/status`, `PATCH /:id/assign`, `PATCH /:id/note`, `POST /:id/convert`, `DELETE /:id` | MANAGER |
| Posts | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/publish`, `DELETE /:id` | ADMIN |
| Testimonials | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/publish`, `DELETE /:id` | ADMIN |
| Messages | `GET`, `GET /:id`, `PATCH /:id/read`, `DELETE /:id` | MANAGER |
| Settings | `GET /settings`, `PUT /settings/:key` | ADMIN |
| Uploads | `POST /uploads/image`, `DELETE /uploads/:id` | MANAGER |
| Statistics | `GET /statistics/overview` | MANAGER |

"Min role" is a rank, not a list: a route marked MANAGER also admits ADMIN and
SUPER_ADMIN.

### Key business rules

| Rule | Behaviour |
|---|---|
| Slugs | Generated from `title.uz`, transliterated from Cyrillic and Uzbek-Latin; collisions get `-2`, `-3`, … |
| Group capacity | `freeSeats = capacity − active students`; a full group returns 409 `GROUP_CAPACITY_EXCEEDED`, re-checked inside the transaction |
| Lead conversion | Creates the student and sets `ENROLLED` in one transaction; a second attempt returns 409 |
| Publishing | Unpublished courses and posts are invisible on every public route, including direct slug access (404) |
| Delete safety | A category holding courses, a course holding groups, a group holding students, and a teacher leading groups all return 409 |
| Phone numbers | Accepted loosely, normalised to `+998XXXXXXXXX`, rejected with 422 when unusable |
| Rich text | Sanitised server-side against a conservative tag whitelist before storage |

---

## Response envelope

Every successful response:

```jsonc
{
  "success": true,
  "statusCode": 200,
  "data": { },
  "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4, "hasNext": true, "hasPrev": false },
  "timestamp": "2026-08-19T09:12:00.000Z"
}
```

`meta` appears only on paginated responses. Every failure:

```jsonc
{
  "success": false,
  "statusCode": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "phone", "message": "phone must match +998XXXXXXXXX" }]
  },
  "path": "/api/v1/leads",
  "timestamp": "2026-08-19T09:12:00.000Z"
}
```

Clients branch on `error.code`, never on the message:

`VALIDATION_ERROR` · `UNAUTHORIZED` · `INVALID_CREDENTIALS` · `TOKEN_EXPIRED` ·
`FORBIDDEN` · `NOT_FOUND` · `ALREADY_EXISTS` · `CONFLICT` ·
`GROUP_CAPACITY_EXCEEDED` · `FILE_TOO_LARGE` · `UNSUPPORTED_FILE_TYPE` ·
`RATE_LIMITED` · `INTERNAL_ERROR`

Prisma failures are translated: `P2002 → 409 ALREADY_EXISTS`,
`P2025 → 404 NOT_FOUND`, `P2003 → 409 CONFLICT`.

---

## Testing

```bash
pnpm test          # unit tests
pnpm test:cov      # with coverage
pnpm test:e2e      # end-to-end
```

**Unit tests** mock the repository ports, so no database is involved. They cover
every use case with branching logic: authentication and token rotation, slug
generation, group capacity, lead conversion, publishing rules, phone
normalisation, pagination and HTML sanitisation.

**E2E tests** boot the real `AppModule` against a dedicated database and drive it
through HTTP. Create `.env.test` once — copy `.env.example` and point
`DATABASE_URL` at a database whose name contains `test`:

```bash
cp .env.example .env.test   # then set DATABASE_URL=…/mars_space_test
```

After that no setup is needed: `pretest:e2e` reads `.env.test`, creates
`mars_space_test` if it is missing and applies every migration. It refuses to
run against a database whose name does not contain `test`, because the suite
truncates every table between suites.
The suites cover the full auth flow, public listing with filters and pagination,
404 on an unpublished slug, lead capture with honeypot and rate limiting, a
complete admin CRUD cycle, and role rejection in both directions.

---

## Adding a new module

Say you are adding **certificates**.

1. **Model it.** Add the model to `prisma/schema.prisma`, then
   `pnpm db:migrate --name add_certificates`.

2. **Scaffold the four layers.**

   ```
   src/modules/certificates/
   ├── domain/entities/certificate.entity.ts
   ├── domain/repositories/certificate.repository.ts
   ├── application/dto/certificate.dto.ts
   ├── application/mappers/certificate.mapper.ts
   ├── application/use-cases/…
   ├── infrastructure/persistence/prisma-certificate.repository.ts
   ├── presentation/certificates.admin.controller.ts
   └── certificates.module.ts
   ```

3. **Write the domain first.** A plain class for the entity, and an
   `abstract class CertificateRepository` listing the operations the
   application needs. No Nest decorators, no Prisma.

4. **Write the use cases.** One class, one public `execute()`. Inject the
   abstract repository — never `PrismaService`.

5. **Implement the repository.** Extend `BasePrismaRepository` for pagination
   and sorting, and convert rows to domain objects in a local `toDomain`.

6. **Add the controller.** Validate with DTOs, delegate, return a mapped
   response. Guard it with `@Roles(...)`, document it with `@ApiTags`,
   `@ApiOperation` and `@ApiOkEnvelope` / `@ApiOkPaginated`.

7. **Wire the module** and register it in `app.module.ts`:

   ```ts
   @Module({
     controllers: [CertificatesAdminController],
     providers: [
       { provide: CertificateRepository, useClass: PrismaCertificateRepository },
       IssueCertificateUseCase,
     ],
     exports: [CertificateRepository],
   })
   export class CertificatesModule {}
   ```

8. **Test it.** A unit spec per use case with a mocked port, and an e2e spec if
   it adds routes.

---

## Security notes

- Access tokens live 15 minutes. Refresh tokens live 7 days, are stored only as
  a SHA-256 digest, rotate on every refresh, and are revoked on logout, on
  password change, and when an account is deactivated or has its role changed.
- `JwtStrategy` re-reads the user on every request, so a deactivated or demoted
  account stops working immediately rather than when its token expires.
- `JwtAuthGuard` and `RolesGuard` are registered globally; a route is public only
  when it says so with `@Public()`.
- Rate limits: 100 req/min/IP globally, 5/min on `/auth/login`, 3/min on
  `/leads` and `/contact`.
- `helmet`, a CORS whitelist, a 1 MB JSON body limit and a 10 MB upload limit.
- Uploads accept `image/jpeg|png|webp|svg+xml` only, verified from the file's
  own bytes rather than the declared type. Filenames are regenerated, and SVG
  content is stripped of scripts, event handlers and `javascript:` URLs.
- Passwords, tokens and auth request bodies are redacted from the logs.
- Password hashes never leave the application layer — responses are built field
  by field in mappers.
