import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { Badge, Button, Container, ErrorState, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { breadcrumbJsonLd, courseJsonLd } from '@/shared/seo/jsonld';
import { useCourse, useCourses } from '@/entities/course/hooks';
import { CourseCard } from '@/entities/course/ui/CourseCard';
import { Testimonials } from '@/widgets/testimonials/Testimonials';
import { useLocalize } from '@/shared/lib/localize';
import { formatPrice } from '@/shared/lib/formatPrice';
import { formatDateShort } from '@/shared/lib/formatDate';
import { useLeadModal } from '@/features/lead-form';
import { paths } from '@/app/router/paths';
import { env } from '@/shared/config/env';
import type { Course } from '@/entities/course/types';

function EnrolCard({ course }: { course: Course }) {
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation();
  const { t: tl, lang } = useLocalize();
  const openModal = useLeadModal((s) => s.openModal);
  const { price } = course;
  const discounted = price.discountAmount != null;
  const nextGroup = course.groups[0];

  return (
    <div className="corner-ticks rounded-md border border-hairline bg-basalt p-6">
      <div className="flex items-end gap-2">
        <span className="font-mono text-3xl text-sol">
          {formatPrice(price.effectiveAmount, lang, price.currency)}
        </span>
      </div>
      {discounted && (
        <span className="font-mono text-sm text-dust line-through">
          {formatPrice(price.amount, lang, price.currency)}
        </span>
      )}

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-hairline pb-3">
          <dt className="text-dust">{t('detail.duration')}</dt>
          <dd className="font-mono text-ice">
            {tc('course.duration', { count: course.durationMonths })}
          </dd>
        </div>
        <div className="flex justify-between border-b border-hairline pb-3">
          <dt className="text-dust">{t('detail.lessonsPerWeek')}</dt>
          <dd className="font-mono text-ice">{course.lessonsPerWeek}</dd>
        </div>
        <div className="flex justify-between border-b border-hairline pb-3">
          <dt className="text-dust">{t('detail.lessonLength')}</dt>
          <dd className="font-mono text-ice">{t('detail.minutes', { count: course.lessonMinutes })}</dd>
        </div>
        <div className="flex justify-between border-b border-hairline pb-3">
          <dt className="text-dust">{t('detail.format')}</dt>
          <dd className="font-mono text-ice">{tc(`course.format.${course.format}`)}</dd>
        </div>
        {nextGroup && (
          <div className="flex justify-between">
            <dt className="text-dust">{t('detail.nextIntake')}</dt>
            <dd className="text-right">
              <span className="font-mono text-ice">{formatDateShort(nextGroup.startDate, lang)}</span>
              <br />
              {nextGroup.freeSeats > 0 ? (
                <span className="font-mono text-xs text-signal">
                  {tc('course.seatsLeft', { count: nextGroup.freeSeats })}
                </span>
              ) : (
                <span className="font-mono text-xs text-alert">{tc('course.full')}</span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() =>
          openModal({ courseId: course.id, courseTitle: tl(course.title), source: 'COURSE_PAGE' })
        }
      >
        {t('detail.enroll')}
      </Button>
    </div>
  );
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation();
  const { t: tl, tList } = useLocalize();
  const { data: course, isLoading, isError, refetch } = useCourse(slug);

  const related = useCourses({
    categorySlug: course?.category?.slug,
    limit: 3,
  });

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="mb-6 h-8 w-1/2" />
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </Container>
    );
  }

  if (isError || !course) {
    return (
      <Container className="py-16">
        <ErrorState
          title={tc('states.errorTitle')}
          description={tc('states.errorDescription')}
          onRetry={() => void refetch()}
          retryLabel={tc('actions.retry')}
        />
      </Container>
    );
  }

  const title = tl(course.title);
  const outcomes = tList(course.outcomes);
  const requirements = tList(course.requirements);
  const url = `${env.VITE_SITE_URL}${paths.course(course.slug)}`;
  const relatedCourses = related.data?.items.filter((c) => c.id !== course.id).slice(0, 3) ?? [];

  return (
    <>
      <Seo
        title={title}
        description={tl(course.shortDescription)}
        path={paths.course(course.slug)}
        image={course.coverImageUrl ?? undefined}
        jsonLd={[
          courseJsonLd({ name: title, description: tl(course.shortDescription), url }),
          breadcrumbJsonLd([
            { name: tc('nav.courses'), url: `${env.VITE_SITE_URL}${paths.courses}` },
            { name: title, url },
          ]),
        ]}
      />

      <Container className="py-10">
        <nav className="mb-6 font-mono text-xs text-dust">
          <Link to={paths.courses} className="hover:text-ice">
            {tc('nav.courses')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ice">{title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-md border border-hairline bg-basalt-raised">
              {course.coverImageUrl ? (
                <img
                  src={course.coverImageUrl}
                  alt={title}
                  width={800}
                  height={450}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="hairline-grid h-full w-full" aria-hidden="true" />
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>{tc(`course.level.${course.level}`)}</Badge>
              <Badge>{tc(`course.format.${course.format}`)}</Badge>
              {course.category && <Badge variant="oxide">{tl(course.category.name)}</Badge>}
            </div>

            <h1 className="mt-4 font-display text-h2">{title}</h1>

            <div
              className="mt-6 space-y-4 text-dust [&_a]:text-oxide [&_h2]:font-display [&_h2]:text-h3"
              dangerouslySetInnerHTML={{ __html: tl(course.description) }}
            />

            {outcomes.length > 0 && (
              <section className="mt-10">
                <h2 className="eyebrow mb-4">{t('detail.outcomes')}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {outcomes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ice">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {requirements.length > 0 && (
              <section className="mt-10">
                <h2 className="eyebrow mb-4">{t('detail.requirements')}</h2>
                <ul className="space-y-2">
                  {requirements.map((item, i) => (
                    <li key={i} className="text-sm text-dust">
                      — {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {course.syllabus && course.syllabus.length > 0 && (
              <section className="mt-10">
                <h2 className="eyebrow mb-4">{t('detail.syllabus')}</h2>
                <div className="divide-y divide-hairline rounded-md border border-hairline">
                  {course.syllabus.map((mod) => (
                    <details key={mod.order} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol">
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-oxide">
                            {String(mod.order).padStart(2, '0')}
                          </span>
                          <span className="font-medium">{tl(mod.title)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-dust">
                            {t('detail.weeks', { count: mod.durationWeeks })}
                          </span>
                          <ChevronDown className="h-4 w-4 text-dust transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <ul className="px-5 pb-4 pl-14">
                        {tList(mod.topics).map((topic, i) => (
                          <li key={i} className="py-1 text-sm text-dust">
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {course.teachers.length > 0 && (
              <section className="mt-10">
                <h2 className="eyebrow mb-4">{t('detail.teachers')}</h2>
                <div className="flex flex-wrap gap-4">
                  {course.teachers.map((teacher) => (
                    <Link
                      key={teacher.id}
                      to={paths.teacher(teacher.slug)}
                      className="flex items-center gap-3 rounded-md border border-hairline p-3 transition-colors hover:border-oxide/40"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-basalt-raised font-display text-sm">
                        {teacher.fullName.charAt(0)}
                      </span>
                      <span>
                        <span className="block text-sm text-ice">{teacher.fullName}</span>
                        <span className="block text-xs text-dust">{tl(teacher.position)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-10">
              <Testimonials courseId={course.id} />
            </section>
          </div>

          {/* Right column — sticky enrolment card (desktop); inline on mobile. */}
          <aside>
            <div className="lg:sticky lg:top-24">
              <EnrolCard course={course} />
            </div>
          </aside>
        </div>

        {relatedCourses.length > 0 && (
          <section className="mt-16">
            <h2 className="eyebrow mb-6">{t('detail.related')}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCourses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
