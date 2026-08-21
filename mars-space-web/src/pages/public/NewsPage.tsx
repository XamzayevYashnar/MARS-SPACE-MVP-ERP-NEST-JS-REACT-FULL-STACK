import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { PostCard } from '@/entities/post/ui/PostCard';
import { usePosts } from '@/entities/post/hooks';
import { paths } from '@/app/router/paths';

export function NewsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const tag = params.get('tag') ?? undefined;

  const { data, isLoading, isError, refetch } = usePosts({ page, limit: 9, tag });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  };

  return (
    <>
      <Seo title={t('nav.news')} path={paths.news} />
      <Container className="py-16">
        <SectionHeading eyebrow="MARS SPACE // LOG" title={t('nav.news')} />

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            title={t('states.errorTitle')}
            description={t('states.errorDescription')}
            onRetry={() => void refetch()}
            retryLabel={t('actions.retry')}
          />
        )}

        {!isLoading && !isError && (!data || data.items.length === 0) && (
          <EmptyState title={t('states.emptyTitle')} />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {data.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Container>
    </>
  );
}
