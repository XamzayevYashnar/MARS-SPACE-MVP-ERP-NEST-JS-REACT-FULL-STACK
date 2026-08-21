# DECISIONS.md

Deviations from the technical specification, and the ambiguities that had to be
resolved to implement it. Each entry names the section it relates to, what was
decided, and why.

---

## 1. `@Roles()` enforces a minimum rank, not set membership

**§6.3, §7.** The endpoint table lists a *minimum* role per resource
("Min role: MANAGER"), while §7 describes `RolesGuard` as reading `@Roles(...)`
metadata with `SUPER_ADMIN` implicitly passing.

A literal set-membership check would make `@Roles(MANAGER)` reject an ADMIN,
which contradicts "minimum". `RolesGuard` therefore compares privilege ranks
(`MANAGER < ADMIN < SUPER_ADMIN`, in `common/enums/role-rank.ts`):
`@Roles(MANAGER)` admits MANAGER and above, `@Roles(SUPER_ADMIN)` admits only
SUPER_ADMIN. `SUPER_ADMIN` passing everything falls out of the ordering rather
than needing a special case. This satisfies the §13 criterion in both
directions: a MANAGER cannot reach ADMIN routes, and an ADMIN cannot reach
SUPER_ADMIN routes.

## 2. Validation failures return 422, other client errors keep their status

**§6.1.** The error envelope example shows `statusCode: 422` with
`VALIDATION_ERROR`. The global `ValidationPipe` is configured with
`errorHttpStatusCode: 422` so DTO failures are 422, which leaves plain 400 free
for domain errors that are well-formed but wrong. Business-rule conflicts use
409, matching §6.4.

## 3. Refresh tokens are opaque random strings, not JWTs

**§7** requires the refresh token to be stored hashed, rotated on refresh and
revoked on logout. It does not require it to be a JWT, and it is only ever
presented back to this API. `TokenService` therefore issues 48 random bytes and
persists only the SHA-256 digest: nothing about the session is readable from the
token itself, and a database leak hands out no live sessions.

## 4. The login path hashes even when the account does not exist

**§6.3.** `LoginUseCase` verifies the supplied password against a fixed dummy
argon2 hash when the email is unknown, so an unregistered address costs the same
time as a wrong password. Without this the endpoint is a user-enumeration oracle.

## 5. `POST /leads` returns an acknowledgement, not the created lead

**§6.3** specifies lead capture with a honeypot but does not fix the response
body. The endpoint returns `{ accepted, message }` with no id. A public endpoint
that echoed the stored record would leak ids, and a honeypot only works if the
bot cannot tell it was caught — so the bot receives exactly what a human does
while nothing is written.

## 6. Group name uniqueness is declared inline

**§5.2** writes `@@unique([name])` on `Group`. The schema uses the equivalent
field-level `@unique`; the resulting constraint is identical.

## 7. Phone validation happens in the use case, not the DTO

**§6.4.6** requires normalisation before persistence and rejection of anything
that is not `+998XXXXXXXXX`. Validating in the DTO would reject `90 123 45 67`,
which the same rule says to accept and normalise. The DTOs therefore bound the
length only, and the use cases normalise first and throw
`InvalidPhoneException` (422, with the field named) when the result is invalid.

## 8. Capacity is checked twice: once for the message, once for correctness

**§6.4.2.** The use case checks free seats to produce a precise error
(`GROUP_CAPACITY_EXCEEDED` vs "the group is finished"), and the repository
re-checks inside the same transaction as the insert. A check outside the
transaction alone would let two managers both fill the last seat.

## 9. Lead conversion is idempotent by refusal

**§6.4.3** states that converting an already-converted lead returns 409. This is
implemented at both levels: the use case rejects an `ENROLLED` lead, and
`convertToStudent` re-reads the status inside the transaction, so two concurrent
conversions yield one student and one 409 rather than two students.

## 10. `PATCH /admin/leads/:id/status` refuses to set `ENROLLED`

Setting `ENROLLED` by hand would leave the pipeline claiming an enrolment with
no student record behind it. The endpoint returns 409 pointing at
`POST /admin/leads/:id/convert`, which creates both in one transaction.

## 11. Unpublishing a course also clears `isFeatured`

**§6.4.4** requires unpublished content to be invisible everywhere public.
`GET /courses/featured` reads featured *and* published courses, so an
unpublished-but-featured course would simply vanish from the carousel; clearing
the flag keeps the stored state honest about what the site shows. Symmetrically,
featuring an unpublished course is rejected with 409.

## 12. Localised search is per-locale and case-sensitive for non-Latin scripts

**§6.2** requires `search` on list endpoints. Prisma cannot do a
case-insensitive `contains` inside a JSONB path, so `BasePrismaRepository`
matches `string_contains` against each of the three locales. Latin-script terms
still match through the non-JSON columns (slug, name), which are compared
case-insensitively. Full case-insensitive localised search needs a generated
column or a trigram index — deliberately out of scope for the MVP.

## 13. The syllabus keeps its localised shape even when `?lang=` is set

**§6.2** describes `lang` as flattening `LocalizedText` to a string. The syllabus
is a nested array of objects, and flattening it would need a parallel response
type for no practical gain — the frontend renders it from one structure either
way. Scalar localised fields flatten as specified; `syllabus` does not.

## 14. `GET /settings` exposes a fixed whitelist

**§6.3** calls it a "public settings bundle (contacts, socials, hero stats, SEO
defaults)". The use case reads exactly those four keys rather than returning
every row, so an internal key added later cannot become public by accident.

## 15. The S3 storage driver is an adapter interface, not a working driver

**§2** lists file upload as "local disk in dev, S3-compatible adapter
interface". `StorageService` is the port, `LocalStorageService` is the working
implementation, and `S3StorageService` implements the port and computes keys and
URLs but throws `503` on transfer. Selecting `STORAGE_DRIVER=s3` therefore fails
loudly instead of silently dropping uploads.

## 16. Uploads are typed from magic bytes, and SVGs are rewritten

**§7** requires validation by magic bytes rather than the declared MIME type.
`ImageInspectorService` identifies JPEG, PNG, WebP and SVG from their leading
bytes and reads their dimensions. SVG is XML and can carry script, so its
content is stripped of `<script>`, `<foreignObject>`, inline `on*` handlers,
DOCTYPE/ENTITY declarations and `javascript:` URLs before it is written. Raster
EXIF is not stripped: doing it properly needs an image-processing dependency,
and the filename is regenerated regardless, so no path or original name leaks.

## 17. The post view counter is in-process

**§6.4.8** explicitly allows an in-memory LRU for the MVP. `ViewCounterService`
keeps a bounded `Map` keyed by `postId:ip`. It is per-process, so a
multi-instance deployment counts one view per instance per hour — an accepted
trade for a vanity counter, and the reason the logic sits behind a service that
a Redis implementation can replace without touching the use case.

## 18. Postgres is published on host port 5433

`docker-compose.yml` maps `5433:5432` so the container does not collide with a
PostgreSQL already installed on the developer machine. Inside the compose
network the API still connects on 5432.

## 19. The seeder is compiled rather than run through ts-node in Docker

**§11** requires `docker compose up` to yield a migrated, seeded database. Rather
than shipping ts-node and the TypeScript sources in the runtime image,
`tsconfig.seed.json` compiles the seeder to `dist-seed/`, and compose runs
`node dist-seed/prisma/seed.js`. Locally, `pnpm db:seed` still uses ts-node
through Prisma's `seed` hook.

## 20. `sanitize-html` is pinned to 2.14.0

Versions from 2.15 depend on `htmlparser2@12`, which is ESM-only and cannot be
required by Jest's CommonJS runtime. 2.14.0 is the version named in §2 and keeps
the test suite running without a transform exception for `node_modules`.

## 21. Husky hooks are installed from the repository root

The API lives in `mars-space-api/` inside a repository whose root is one level
up, so `husky` cannot find `.git` from the package directory. The `prepare`
script falls back to installing from the parent
(`husky mars-space-api/.husky`), and `pnpm hooks:install` does it explicitly.

## 22. The domain imports two things from outside: generated enums and `HttpStatus`

**§3** says the domain layer imports nothing from the other three layers. Two
exceptions are deliberate, and both are plain values rather than framework
machinery — no decorators, no DI, no HTTP objects, no `PrismaClient`:

- **Enums from `@prisma/client`** (`CourseLevel`, `GroupStatus`, `LeadStatus`,
  `StudentStatus`, `UserRole`, `WeekDay`). §5.2 defines these in the Prisma
  schema, so re-declaring them in the domain would create a second source of
  truth that can drift from the database without the compiler noticing.
- **`HttpStatus` from `@nestjs/common`** in three domain error files. These
  extend `DomainException`, which §4 places in `common/exceptions` and which
  carries a status code; `HttpStatus` is a numeric enum used as a named constant.

Everything the rule is actually protecting against — ORM types, Nest decorators,
request/response objects — stays out of the domain.

## 23. `multer` and the Prisma CLI are direct runtime dependencies

`UploadsModule` imports `memoryStorage` from `multer` directly, and the API
container runs `prisma migrate deploy` on start. Under pnpm's strict
`node_modules` layout neither is resolvable as a transitive dependency of
`@nestjs/platform-express` / a devDependency after `pnpm prune --prod`, so both
are declared as direct `dependencies`. The container invokes the CLI as
`node node_modules/prisma/build/index.js` rather than through `npx`, which would
otherwise download a different major version at runtime.

## 24. E2E specs reset the rate-limit counters between cases

The rate limits are real and are asserted in `leads.e2e-spec.ts`. Every other
spec clears the throttler storage in `beforeEach`, so a suite that logs in thirty
times does not start failing at the sixth for a reason unrelated to what it
tests.
