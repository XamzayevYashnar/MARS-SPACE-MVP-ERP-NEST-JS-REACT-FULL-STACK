import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container, Pagination } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { CourseGrid } from '@/widgets/course-grid/CourseGrid';
import {
  CourseFilters,
  type CourseFilterValues,
} from '@/features/course-filters/CourseFilters';
import { useCategories } from '@/entities/category/hooks';
import { useCourses } from '@/entities/course/hooks';
import type { CourseFormat, CourseLevel } from '@/shared/types/common.types';
import { paths } from '@/app/router/paths';

export function CoursesPage() {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation();
  const [params, setParams] = useSearchParams();

  const values: CourseFilterValues = {
    search: params.get('search') ?? '',
    category: params.get('category') ?? undefined,
    level: (params.get('level') as CourseLevel | null) ?? undefined,
    format: (params.get('format') as CourseFormat | null) ?? undefined,
  };
  const page = Number(params.get('page') ?? 1);

  const { data: categories } = useCategories();
  const query = useCourses({
    page,
    limit: 9,
    search: values.search || undefined,
    categorySlug: values.category,
    level: values.level,
    format: values.format,
  });

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page'); // any filter change resets pagination
    setParams(next);
  };

  const onFilterChange = (patch: Partial<CourseFilterValues>) => patchParams(patch);

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  };

  const total = query.data?.meta.total ?? 0;

  return (
    <>
      <Seo title={t('title')} path={paths.courses} />
      <Container className="py-10">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />

        <CourseFilters
          categories={categories}
          values={values}
          onChange={onFilterChange}
          onClear={() => setParams(new URLSearchParams())}
        />

        {/* Announce result count to assistive tech (spec §6.2). */}
        <p className="mb-6 mt-4 font-mono text-xs text-dust" aria-live="polite">
          {query.isSuccess ? t('filters.results', { count: total }) : ' '}
        </p>

        <CourseGrid
          courses={query.data?.items}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          skeletonCount={9}
          emptyAction={
            <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>
              {t('filters.clear')}
            </Button>
          }
        />

        {query.data && query.data.meta.totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              onPageChange={setPage}
              label={tc('nav.courses')}
            />
          </div>
        )}
      </Container>
    </>
  );
}
