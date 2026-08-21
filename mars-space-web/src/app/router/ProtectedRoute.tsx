import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { AUTH_UNAUTHORIZED_EVENT } from '@/shared/api/axios-instance';
import { paths } from './paths';
import type { UserRole } from '@/shared/types/common.types';

export interface ProtectedRouteProps {
  children: ReactNode;
  /** When set, the user must hold one of these roles or sees a 403. */
  roles?: UserRole[];
}

/**
 * Guards admin routes (spec §7.3/§7.4). Unauthenticated users are redirected to
 * login with a `from` param; authenticated-but-unauthorised users get a 403
 * screen rather than a redirect loop. Also listens for a hard logout from the
 * axios refresh-failure path.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    const onUnauthorized = () => {
      void navigate(`${paths.admin.login}?from=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [navigate, location.pathname]);

  if (!isAuthenticated) {
    return (
      <Navigate to={`${paths.admin.login}?from=${encodeURIComponent(location.pathname)}`} replace />
    );
  }

  if (roles && (!role || !roles.includes(role))) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-5xl text-alert">403</p>
        <p className="mt-4 text-dust">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
