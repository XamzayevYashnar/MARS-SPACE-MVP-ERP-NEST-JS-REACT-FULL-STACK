import { APP_NAME } from '@/shared/config/constants';
import { env } from '@/shared/config/env';

/** Site-wide Organization schema (spec §10). */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: APP_NAME,
    url: env.VITE_SITE_URL,
    logo: `${env.VITE_SITE_URL}/favicon.svg`,
  };
}

export function courseJsonLd(params: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.name,
    description: params.description,
    url: params.url,
    provider: {
      '@type': 'EducationalOrganization',
      name: APP_NAME,
      sameAs: env.VITE_SITE_URL,
    },
  };
}

export function articleJsonLd(params: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string | null;
  image?: string | null;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    url: params.url,
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    ...(params.image ? { image: params.image } : {}),
    publisher: { '@type': 'Organization', name: APP_NAME },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
