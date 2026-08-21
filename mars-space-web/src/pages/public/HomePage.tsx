import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Code,
  FolderGit2,
  Palette,
  Server,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button, Container } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { organizationJsonLd } from '@/shared/seo/jsonld';
import { paths } from '@/app/router/paths';
import { useLocalize } from '@/shared/lib/localize';
import { useCategories } from '@/entities/category/hooks';
import { useFeaturedCourses } from '@/entities/course/hooks';
import { usePosts } from '@/entities/post/hooks';
import { PostCard } from '@/entities/post/ui/PostCard';
import { Hero } from '@/widgets/hero/Hero';
import { SectionHeading } from '@/widgets/section/SectionHeading';
import { CourseGrid } from '@/widgets/course-grid/CourseGrid';
import { TeachersCarousel } from '@/widgets/teachers-carousel/TeachersCarousel';
import { Testimonials } from '@/widgets/testimonials/Testimonials';
import { FaqAccordion, type FaqItem } from '@/widgets/faq-accordion/FaqAccordion';
import { CtaBanner } from '@/widgets/cta-banner/CtaBanner';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  code: Code,
  server: Server,
  palette: Palette,
};

const WHY_ICONS: Record<string, LucideIcon> = {
  smallGroups: Users,
  mentors: Briefcase,
  portfolio: FolderGit2,
  career: Briefcase,
};

export function HomePage() {
  const { t } = useTranslation('home');
  const { t: tc } = useTranslation();
  const { t: tl } = useLocalize();

  const categories = useCategories();
  const featured = useFeaturedCourses();
  const news = usePosts({ limit: 3 });

  const whyKeys = ['smallGroups', 'mentors', 'portfolio', 'career'] as const;
  const processKeys = ['application', 'interview', 'trial', 'enrolment'] as const;
  const faqItems = t('faq.items', { returnObjects: true }) as FaqItem[];

  return (
    <>
      <Seo path={paths.home} jsonLd={organizationJsonLd()} />

      <Hero />

      {/* Directions */}
      {categories.data && categories.data.length > 0 && (
        <Container className="py-16">
          <SectionHeading title={t('directions.title')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.data.map((cat) => {
              const Icon = (cat.iconKey && CATEGORY_ICONS[cat.iconKey]) || Code;
              return (
                <Link
                  key={cat.id}
                  to={`${paths.courses}?category=${cat.slug}`}
                  className="group rounded-md border border-hairline bg-basalt p-5 transition-colors hover:border-oxide/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
                >
                  <Icon className="h-6 w-6 text-oxide" />
                  <h3 className="mt-4 font-display text-lg">{tl(cat.name)}</h3>
                  <p className="mt-1 font-mono text-xs text-dust">
                    {t('directions.courses', { count: cat.courseCount ?? 0 })}
                  </p>
                  {cat.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-dust opacity-0 transition-opacity group-hover:opacity-100">
                      {tl(cat.description)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </Container>
      )}

      {/* Featured courses */}
      <Container className="py-16">
        <SectionHeading
          title={t('featured.title')}
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to={paths.courses}>{t('featured.cta')}</Link>
            </Button>
          }
        />
        <CourseGrid
          courses={featured.data}
          isLoading={featured.isLoading}
          isError={featured.isError}
          onRetry={() => void featured.refetch()}
          skeletonCount={3}
        />
      </Container>

      {/* Why Mars Space */}
      <section className="border-y border-hairline bg-basalt">
        <Container className="py-16">
          <SectionHeading title={t('why.title')} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyKeys.map((key) => {
              const Icon = WHY_ICONS[key] ?? Users;
              return (
                <div key={key} className="rounded-md border border-hairline bg-void p-5">
                  <Icon className="h-6 w-6 text-sol" />
                  <h3 className="mt-4 font-display text-lg">{t(`why.${key}.title`)}</h3>
                  <p className="mt-2 text-sm text-dust">{t(`why.${key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Teachers */}
      <Container className="py-16">
        <SectionHeading
          title={t('teachers.title')}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to={paths.teachers}>{tc('actions.viewAll')}</Link>
            </Button>
          }
        />
        <TeachersCarousel />
      </Container>

      {/* Process */}
      <section className="border-y border-hairline bg-basalt">
        <Container className="py-16">
          <SectionHeading title={t('process.title')} />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processKeys.map((key, i) => (
              <li key={key} className="rounded-md border border-hairline bg-void p-5">
                <span className="font-mono text-3xl text-oxide">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg">{t(`process.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-dust">{t(`process.${key}.desc`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Testimonials */}
      <Container className="py-16">
        <SectionHeading title={t('testimonials.title')} />
        <Testimonials />
      </Container>

      {/* News */}
      {news.data && news.data.items.length > 0 && (
        <section className="border-t border-hairline bg-basalt">
          <Container className="py-16">
            <SectionHeading
              title={t('news.title')}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link to={paths.news}>{tc('actions.viewAll')}</Link>
                </Button>
              }
            />
            <div className="grid gap-6 md:grid-cols-3">
              {news.data.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FAQ */}
      <Container className="py-16">
        <SectionHeading title={t('faq.title')} />
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={faqItems} />
        </div>
      </Container>

      <CtaBanner />
    </>
  );
}
