import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { APP_NAME, SUPPORTED_LANGUAGES } from '@/shared/config/constants';
import { env } from '@/shared/config/env';

export interface SeoProps {
  /** Page title; the `%s — Mars Space` template is applied unless `rawTitle`. */
  title?: string;
  rawTitle?: string;
  description?: string;
  /** Path (e.g. `/courses`) used for canonical + hreflang alternates. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** One JSON-LD object or an array of them. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function Seo({
  title,
  rawTitle,
  description,
  path,
  image,
  type = 'website',
  noindex,
  jsonLd,
}: SeoProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? 'uz';

  const fullTitle = rawTitle ?? (title ? `${title} — ${APP_NAME}` : APP_NAME);
  const desc = description ?? t('seo.defaultDescription');
  const url = path ? `${env.VITE_SITE_URL}${path}` : env.VITE_SITE_URL;
  const ogImage = image ?? `${env.VITE_SITE_URL}/og-image.svg`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang alternates (language handled client-side; emit anyway, spec §5) */}
      {SUPPORTED_LANGUAGES.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
