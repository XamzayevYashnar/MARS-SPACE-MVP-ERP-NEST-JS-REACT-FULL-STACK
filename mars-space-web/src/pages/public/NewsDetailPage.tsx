import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Container, ErrorState, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { articleJsonLd, breadcrumbJsonLd } from '@/shared/seo/jsonld';
import { usePost } from '@/entities/post/hooks';
import { useLocalize } from '@/shared/lib/localize';
import { formatDate } from '@/shared/lib/formatDate';
import { paths } from '@/app/router/paths';
import { env } from '@/shared/config/env';

export function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { t: tl, lang } = useLocalize();
  const { data: post, isLoading, isError, refetch } = usePost(slug);

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="mb-6 h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (isError || !post) {
    return (
      <Container className="py-16">
        <ErrorState
          title={t('states.errorTitle')}
          description={t('states.errorDescription')}
          onRetry={() => void refetch()}
          retryLabel={t('actions.retry')}
        />
      </Container>
    );
  }

  const title = tl(post.title);
  const url = `${env.VITE_SITE_URL}${paths.newsDetail(post.slug)}`;

  return (
    <>
      <Seo
        title={title}
        description={tl(post.excerpt)}
        path={paths.newsDetail(post.slug)}
        type="article"
        image={post.coverImageUrl ?? undefined}
        jsonLd={[
          articleJsonLd({
            headline: title,
            description: tl(post.excerpt),
            url,
            datePublished: post.publishedAt,
            image: post.coverImageUrl,
          }),
          breadcrumbJsonLd([
            { name: t('nav.news'), url: `${env.VITE_SITE_URL}${paths.news}` },
            { name: title, url },
          ]),
        ]}
      />

      <Container className="py-16">
        <article className="mx-auto max-w-3xl">
          <nav className="mb-6 font-mono text-xs text-dust">
            <Link to={paths.news} className="hover:text-ice">
              {t('nav.news')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ice">{title}</span>
          </nav>

          <div className="mb-4 flex items-center gap-3 font-mono text-xs text-dust">
            {post.publishedAt && <span>{formatDate(post.publishedAt, lang)}</span>}
            <span aria-hidden="true">·</span>
            <span>{post.readMinutes} min</span>
          </div>

          <h1 className="font-display text-h2">{title}</h1>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="oxide">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {post.coverImageUrl && (
            <img
              src={post.coverImageUrl}
              alt={title}
              width={768}
              height={432}
              className="mt-8 aspect-[16/9] w-full rounded-md border border-hairline object-cover"
            />
          )}

          <div
            className="prose-invert mt-8 space-y-4 text-ice [&_a]:text-oxide [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-h3"
            // Content is sanitised server-side (spec §6.4 note on courses/posts).
            dangerouslySetInnerHTML={{ __html: tl(post.content) }}
          />
        </article>
      </Container>
    </>
  );
}
