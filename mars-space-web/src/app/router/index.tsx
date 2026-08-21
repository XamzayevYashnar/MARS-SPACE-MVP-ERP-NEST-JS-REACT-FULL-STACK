import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { publicRoutes } from './routes.public';
import { adminLoginRoute, adminRoutes } from './routes.admin';

const routes: RouteObject[] = [adminLoginRoute, adminRoutes, publicRoutes];

// Dev-only design-system showcase (spec §15.3), lazily loaded so it never ships
// to production.
if (import.meta.env.DEV) {
  routes.unshift({
    path: '/dev/ui',
    lazy: () => import('@/pages/dev/DevUIPage').then((m) => ({ Component: m.DevUIPage })),
  });
}

export const router = createBrowserRouter(routes);
