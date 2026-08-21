import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { RouteError } from './RouteError';

/**
 * Public routes. Each page is a lazily-loaded chunk (spec §10) so the initial
 * bundle carries only the layout + the landing page. The layout stays eager so
 * the header/footer paint immediately.
 */
export const publicRoutes: RouteObject = {
  path: '/',
  element: <PublicLayout />,
  errorElement: <RouteError />,
  children: [
    {
      index: true,
      lazy: () => import('@/pages/public/HomePage').then((m) => ({ Component: m.HomePage })),
    },
    {
      path: 'courses',
      lazy: () => import('@/pages/public/CoursesPage').then((m) => ({ Component: m.CoursesPage })),
    },
    {
      path: 'courses/:slug',
      lazy: () =>
        import('@/pages/public/CourseDetailPage').then((m) => ({ Component: m.CourseDetailPage })),
    },
    {
      path: 'teachers',
      lazy: () => import('@/pages/public/TeachersPage').then((m) => ({ Component: m.TeachersPage })),
    },
    {
      path: 'teachers/:slug',
      lazy: () =>
        import('@/pages/public/TeacherDetailPage').then((m) => ({ Component: m.TeacherDetailPage })),
    },
    {
      path: 'about',
      lazy: () => import('@/pages/public/AboutPage').then((m) => ({ Component: m.AboutPage })),
    },
    {
      path: 'news',
      lazy: () => import('@/pages/public/NewsPage').then((m) => ({ Component: m.NewsPage })),
    },
    {
      path: 'news/:slug',
      lazy: () =>
        import('@/pages/public/NewsDetailPage').then((m) => ({ Component: m.NewsDetailPage })),
    },
    {
      path: 'contact',
      lazy: () => import('@/pages/public/ContactPage').then((m) => ({ Component: m.ContactPage })),
    },
    {
      path: '*',
      lazy: () => import('@/pages/public/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
    },
  ],
};
