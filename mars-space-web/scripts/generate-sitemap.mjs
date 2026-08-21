/**
 * Generate public/sitemap.xml from the static public routes (spec §10).
 * Dynamic entries (courses/teachers/posts) can be appended by fetching the API;
 * this build-time script emits the stable routes and is safe to run offline.
 *
 * Override the base URL with SITE_URL (defaults to the production domain).
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  // Best-effort read of VITE_SITE_URL from .env.
  const envFile = join(root, '.env');
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, 'utf8').match(/^VITE_SITE_URL=(.+)$/m);
    if (match) return match[1].trim().replace(/\/$/, '');
  }
  return 'https://marsspace.uz';
}

const site = resolveSiteUrl();
const languages = ['uz', 'ru', 'en'];

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/courses', priority: '0.9', changefreq: 'weekly' },
  { path: '/teachers', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/news', priority: '0.7', changefreq: 'weekly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
];

const today = new Date().toISOString().slice(0, 10);

function urlEntry({ path, priority, changefreq }) {
  const loc = `${site}${path}`;
  const alternates = languages
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}" />`)
    .join('\n');
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes.map(urlEntry).join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`✓ sitemap.xml generated (${routes.length} routes, base ${site})`);
