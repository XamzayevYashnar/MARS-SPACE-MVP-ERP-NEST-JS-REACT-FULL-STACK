import { useEffect, useRef } from 'react';
import { authApi } from '@/shared/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

/**
 * Restores the admin session once per page load.
 *
 * The access token is deliberately memory-only, so a reload starts with none.
 * The refresh token, however, is still in its httpOnly cookie — one silent
 * refresh turns it back into a live session, and the user never sees the login
 * screen for having pressed F5.
 *
 * `isBootstrapped` is set on both paths: `ProtectedRoute` waits on it, and
 * leaving it false after a failure would hang the guard on its spinner forever.
 */
export function useSessionBootstrap(): void {
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in development; one refresh per load is
    // the point, and a second would rotate the token out from under the first.
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const { accessToken, user, markBootstrapped, setAccessToken, clearSession } =
      useAuthStore.getState();

    if (accessToken) {
      markBootstrapped();
      return;
    }

    // A visitor who has never signed in on this browser has no cookie to trade,
    // so the marketing pages skip the request entirely.
    if (!user) {
      markBootstrapped();
      return;
    }

    void authApi
      .refresh()
      .then(({ accessToken: fresh }) => {
        setAccessToken(fresh);
        return authApi.me();
      })
      .then((user) => {
        useAuthStore.getState().setUser(user);
        markBootstrapped();
      })
      .catch(() => {
        // No cookie, or it was revoked/expired: this is a signed-out visitor,
        // not an error worth surfacing.
        clearSession();
      });
  }, []);
}
