import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Container, ErrorState, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { useTeacher } from '@/entities/teacher/hooks';
import { useLocalize } from '@/shared/lib/localize';
import { paths } from '@/app/router/paths';

export function TeacherDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { t: tl } = useLocalize();
  const { data: teacher, isLoading, isError, refetch } = useTeacher(slug);

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (isError || !teacher) {
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

  return (
    <>
      <Seo title={teacher.fullName} description={tl(teacher.position)} path={paths.teacher(teacher.slug)} />
      <Container className="py-16">
        <nav className="mb-6 font-mono text-xs text-dust">
          <Link to={paths.teachers} className="hover:text-ice">
            {t('nav.teachers')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ice">{teacher.fullName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-md border border-hairline bg-basalt-raised">
              {teacher.photoUrl ? (
                <img
                  src={teacher.photoUrl}
                  alt={teacher.fullName}
                  width={280}
                  height={280}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="hairline-grid h-full w-full" aria-hidden="true" />
              )}
            </div>
            {teacher.socials && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.entries(teacher.socials) as [string, string | undefined][]).map(([key, url]) =>
                  url ? (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-sm border border-hairline px-3 py-1 font-mono text-xs text-dust transition-colors hover:border-oxide/40 hover:text-ice"
                    >
                      {key}
                    </a>
                  ) : null,
                )}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-h2">{teacher.fullName}</h1>
            <p className="mt-2 text-lg text-sol">{tl(teacher.position)}</p>
            <p className="mt-1 font-mono text-xs text-dust">
              {teacher.experienceYears}+ years experience
            </p>

            {teacher.bio && <p className="mt-6 max-w-2xl text-dust">{tl(teacher.bio)}</p>}

            {teacher.skills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {teacher.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            )}

            {teacher.courses && teacher.courses.length > 0 && (
              <div className="mt-10">
                <h2 className="eyebrow mb-4">{t('nav.courses')}</h2>
                <ul className="flex flex-wrap gap-3">
                  {teacher.courses.map((course) => (
                    <li key={course.id}>
                      <Link
                        to={paths.course(course.slug)}
                        className="inline-block rounded-sm border border-hairline px-4 py-2 text-sm transition-colors hover:border-oxide/40 hover:text-ice"
                      >
                        {tl(course.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
