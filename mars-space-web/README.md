# Mars Space — Frontend

React frontend for **Mars Space**, an IT training centre in Uzbekistan. Two surfaces in one codebase:

- **Public website** — marketing site in three languages (uz / ru / en), mobile-first, SEO-aware.
- **Admin panel** — JWT-guarded dashboard for courses, teachers, groups, students, leads, news and settings.

Built with Vite + React + TypeScript (strict), TanStack Query, Zustand, Tailwind (custom token layer), Radix primitives, i18next, React Hook Form + Zod.

## Quick start (≤ 4 commands)

```bash
pnpm install
cp .env.example .env      # then edit values (or keep VITE_MOCK_API=true to run standalone)
pnpm dev                  # http://localhost:5173
```

The app ships with **MSW mock handlers**, so with `VITE_MOCK_API=true` it runs with no backend.
Mock admin login: `admin@marsspace.uz` / `password`.

To run against the real API, set `VITE_MOCK_API=false` and point `VITE_API_URL` at the NestJS backend.

## Environment

Read only through the typed, validated `src/shared/config/env.ts` (fails fast on startup).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | yes | `http://localhost:4000/api/v1` | Backend base URL |
| `VITE_SITE_URL` | yes | `http://localhost:5173` | Canonical/OG/sitemap base |
| `VITE_TELEGRAM_URL` | no | — | Telegram link |
| `VITE_INSTAGRAM_URL` | no | — | Instagram link |
| `VITE_YANDEX_MAP_KEY` | no | — | Contact map |
| `VITE_GA_ID` | no | — | Analytics id |
| `VITE_MOCK_API` | no | `false` | `true` → serve MSW mocks |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Type-check, generate `sitemap.xml`, production build |
| `pnpm preview` | Preview the production build |
| `pnpm lint` / `pnpm lint:fix` | ESLint (+ jsx-a11y) |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm test` / `pnpm test:watch` | Vitest unit/component tests |
| `pnpm test:e2e` | Playwright flows (run `pnpm exec playwright install` once first) |
| `pnpm i18n:check` | Fail if locale key sets diverge |
| `pnpm format` | Prettier |

## Folder structure

Feature-oriented, layered by responsibility. **Import direction:** `pages → widgets → features → entities → shared`. Never import upward or sideways between features.

```
src/
├── app/            # composition root: providers, router, layouts, styles
├── shared/         # feature-agnostic: api, config, hooks, lib, types, validation, ui (design system), seo
├── entities/       # domain models + their cards/hooks (course, teacher, group, post, testimonial, lead, student, category)
├── features/       # user interactions with logic (lead-form, course-filters, language-switcher, theme-toggle, auth-login, contact-form, admin-crud)
├── widgets/        # composed page sections (site-header, hero, mission-board, course-grid, testimonials, faq, cta-banner …)
├── pages/          # public/ and admin/ route components (+ dev/ showcase)
├── store/          # Zustand: auth.store, ui.store
├── locales/        # uz/ ru/ en × {common,validation,home,courses,about,contact,admin}
└── mocks/          # MSW handlers + seed data
```

- **Design system**: `shared/ui` primitives are built on the token layer (`app/styles/globals.css` + `tailwind.config.ts`). Never write a raw hex value in a component. See `DESIGN.md`.
- **Server state**: only via TanStack Query hooks (`entities/*/hooks.ts`, `features/admin-crud`). Query keys live in `shared/api/query-keys.ts`; endpoints in `shared/api/endpoints.ts`.
- **URLs**: only via `app/router/paths.ts` — never inline a route string.

## How to add a public page

1. Create `src/pages/public/MyPage.tsx` (render `<Seo …/>` + your content; handle loading/error/empty/success for any list).
2. Add its URL to `src/app/router/paths.ts`.
3. Register a lazy route in `src/app/router/routes.public.tsx`:
   ```tsx
   { path: 'my-page', lazy: () => import('@/pages/public/MyPage').then((m) => ({ Component: m.MyPage })) }
   ```
4. Add nav links (header/footer) if needed, and a route to `scripts/generate-sitemap.mjs`.

Admin pages are the same but registered in `routes.admin.tsx` (guarded, lazy — keeps TipTap/Recharts/Table out of the public bundle).

## How to add a translation key

1. Add the key to **all three** files for the namespace: `src/locales/{uz,ru,en}/<namespace>.json` (identical key sets — CI enforces this).
2. If it's a new namespace, register it in `src/shared/config/i18n.ts` (`resources` + `ns`). Types update automatically (see `src/@types/i18next.d.ts`), so `t('…')` is checked.
3. Use it: `const { t } = useTranslation('namespace'); t('some.key')`. For localised **content** from the API use `useLocalize()` — never read `title.uz` directly.
4. Run `pnpm i18n:check`.

## Build & deploy

`pnpm build` outputs a static SPA to `dist/`.

**Vercel / Netlify** — framework preset “Vite”, build `pnpm build`, output `dist`. Set the `VITE_*` env vars (with `VITE_SITE_URL` = your domain and `VITE_MOCK_API=false`). SPA fallback is automatic on both (Netlify: add `/* /index.html 200` to `public/_redirects` if you customise).

**Nginx** (self-hosted) — serve `dist/` with an SPA fallback:

```nginx
server {
  listen 80;
  server_name marsspace.uz;
  root /var/www/mars-space-web/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(?:js|css|woff2|svg|jpg|png|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

Generate the sitemap for production with your real domain:

```bash
SITE_URL=https://marsspace.uz pnpm sitemap
```
