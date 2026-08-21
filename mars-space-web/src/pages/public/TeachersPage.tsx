import { useTranslation } from 'react-i18next';
import { Container, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { TeacherCard } from '@/entities/teacher/ui/TeacherCard';
import { useTeachers } from '@/entities/teacher/hooks';
import { paths } from '@/app/router/paths';

export function TeachersPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useTeachers({ limit: 50 });

  return (
    <>
      <Seo title={t('nav.teachers')} path={paths.teachers} />
      <Container className="py-16">
        <SectionHeading eyebrow="MARS SPACE // TEAM" title={t('nav.teachers')} />

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
