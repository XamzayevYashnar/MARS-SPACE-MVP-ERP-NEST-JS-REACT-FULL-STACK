import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteError } from './RouteError';

/**
 * Admin routes — lazily loaded so the layout, CRUD screens and their heavy deps
 * (TipTap, Recharts, TanStack Table) never reach the public bundle (spec §5/§10).
 * Login is public; everything under /admin is guarded.
 */
export const adminLoginRoute: RouteObject = {
  path: '/admin/login',
  lazy: () => import('@/pages/admin/AdminLoginPage').then((m) => ({ Component: m.AdminLoginPage })),
  errorElement: <RouteError />,
};

type Loader = () => Promise<{ Component: React.ComponentType }>;
const page = (loader: Loader) => ({ lazy: loader });

export const adminRoutes: RouteObject = {
  path: '/admin',
  lazy: () =>
    import('@/app/layouts/AdminLayout').then((m) => ({
      Component: () => (
        <ProtectedRoute>
          <m.AdminLayout />
        </ProtectedRoute>
      ),
    })),
  errorElement: <RouteError />,
  children: [
    { index: true, ...page(() => import('@/pages/admin/AdminDashboardPage').then((m) => ({ Component: m.AdminDashboardPage }))) },
    { path: 'leads', ...page(() => import('@/pages/admin/leads/AdminLeadsPage').then((m) => ({ Component: m.AdminLeadsPage }))) },
    { path: 'courses', ...page(() => import('@/pages/admin/courses/AdminCoursesPage').then((m) => ({ Component: m.AdminCoursesPage }))) },
    { path: 'courses/new', ...page(() => import('@/pages/admin/courses/CourseFormPage').then((m) => ({ Component: m.CourseFormPage }))) },
    { path: 'courses/:id/edit', ...page(() => import('@/pages/admin/courses/CourseFormPage').then((m) => ({ Component: m.CourseFormPage }))) },
    { path: 'categories', ...page(() => import('@/pages/admin/AdminCategoriesPage').then((m) => ({ Component: m.AdminCategoriesPage }))) },
    { path: 'teachers', ...page(() => import('@/pages/admin/AdminTeachersPage').then((m) => ({ Component: m.AdminTeachersPage }))) },
    { path: 'groups', ...page(() => import('@/pages/admin/AdminGroupsPage').then((m) => ({ Component: m.AdminGroupsPage }))) },
    { path: 'students', ...page(() => import('@/pages/admin/AdminStudentsPage').then((m) => ({ Component: m.AdminStudentsPage }))) },
    { path: 'news', ...page(() => import('@/pages/admin/news/AdminNewsPage').then((m) => ({ Component: m.AdminNewsPage }))) },
    { path: 'news/new', ...page(() => import('@/pages/admin/news/NewsFormPage').then((m) => ({ Component: m.NewsFormPage }))) },
    { path: 'news/:id/edit', ...page(() => import('@/pages/admin/news/NewsFormPage').then((m) => ({ Component: m.NewsFormPage }))) },
    { path: 'testimonials', ...page(() => import('@/pages/admin/AdminTestimonialsPage').then((m) => ({ Component: m.AdminTestimonialsPage }))) },
    { path: 'messages', ...page(() => import('@/pages/admin/AdminMessagesPage').then((m) => ({ Component: m.AdminMessagesPage }))) },
    { path: 'settings', ...page(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ Component: m.AdminSettingsPage }))) },
    {
      path: 'users',
      lazy: () =>
        import('@/pages/admin/AdminUsersPage').then((m) => ({
          Component: () => (
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <m.AdminUsersPage />
            </ProtectedRoute>
          ),
        })),
    },
  ],
};
