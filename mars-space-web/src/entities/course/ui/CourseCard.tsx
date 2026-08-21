import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Layers } from 'lucide-react';
import { Badge, Card } from '@/shared/ui';
import { paths } from '@/app/router/paths';
import { useLocalize } from '@/shared/lib/localize';
import { formatPrice } from '@/shared/lib/formatPrice';
import type { CourseCardData } from '../types';

export interface CourseCardProps {
  course: CourseCardData;
}

export function CourseCard({ course }: CourseCardProps) {
  const { t } = useTranslation();
  const { t: tl, lang } = useLocalize();
  const { price } = course;
  const discounted = price.discountAmount != null;

  return (
    <Card interactive className="group flex h-full flex-col overflow-hidden">
      <Link
        to={paths.course(course.slug)}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-basalt-raised">
          {course.coverImageUrl ? (
            <img
              src={course.coverImageUrl}
              alt={tl(course.title)}
              loading="lazy"
              width={640}
              height={360}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="hairline-grid h-full w-full" aria-hidden="true" />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="neutral">{t(`course.level.${course.level}`)}</Badge>
            {course.isFeatured && <Badge variant="oxide">★</Badge>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {course.category && (
            <p className="eyebrow mb-2">{tl(course.category.name)}</p>
          )}
          <h3 className="font-display text-h3 leading-tight">{tl(course.title)}</h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-dust">{tl(course.shortDescription)}</p>

          <div className="mt-4 flex items-center gap-4 font-mono text-xs text-dust">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {t('course.duration', { count: course.durationMonths })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {t('course.totalLessons', { count: course.totalLessons })}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
            <div>
              {discounted && (
                <span className="mr-2 font-mono text-sm text-dust line-through">
                  {formatPrice(price.amount, lang, price.currency)}
                </span>
              )}
              <span className="font-mono text-lg text-sol">
                {formatPrice(price.effectiveAmount, lang, price.currency)}
              </span>
            </div>
            {course.teachers.length > 0 && (
              <span className="text-xs text-dust">{course.teachers[0]?.fullName}</span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
