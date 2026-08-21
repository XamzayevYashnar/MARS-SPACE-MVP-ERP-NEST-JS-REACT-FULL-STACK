import { useTranslation } from 'react-i18next';
import { Card, CardBody, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { CourseCard } from '@/entities/course/ui/CourseCard';
import type { CourseCardData } from '@/entities/course/types';

export interface CourseGridProps {
  courses: CourseCardData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  emptyAction?: React.ReactNode;
  /** Skeleton count while loading. */
  skeletonCount?: number;
}

function CardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardBody className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </CardBody>
    </Card>
  );
}

/** Course grid handling all four states (spec §0). Reused on Home and Courses. */
export function CourseGrid({
  courses,
  isLoading,
  isError,
  onRetry,
  emptyAction,
  skeletonCount = 6,
}: CourseGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        onRetry={onRetry}
        retryLabel={t('actions.retry')}
      />
    );
  }

  if (!courses || courses.length === 0) {
    return <EmptyState title={t('states.emptyTitle')} action={emptyAction} />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
