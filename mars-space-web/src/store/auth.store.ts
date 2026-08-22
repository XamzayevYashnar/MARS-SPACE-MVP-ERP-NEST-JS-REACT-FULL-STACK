import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/shared/types/common.types';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  /**
   * False until the app has had one chance to restore a session from the
   * refresh cookie. Guards must wait for it rather than treating "no token
   * yet" as "signed out".
   */
  isBootstrapped: boolean;
  setSession: (params: { accessToken: string; user: AuthUser }) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  markBootstrapped: () => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

/**
 * Auth session (spec §7.3).
 *
 * The access token lives in memory only. It used to be persisted alongside the
 * user, which handed any XSS on the admin panel a ready-to-use bearer token out
 * of `localStorage` — and undid the whole point of keeping the refresh token in
 * an httpOnly cookie. Only the user profile is persisted now, purely so the
 * shell can paint before the session is restored; the token itself is fetched
 * back from the cookie on boot by `useSessionBootstrap`.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isBootstrapped: false,
      setSession: ({ accessToken, user }) => set({ accessToken, user, isBootstrapped: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      markBootstrapped: () => set({ isBootstrapped: true }),
      clearSession: () => set({ accessToken: null, user: null, isBootstrapped: true }),
      isAuthenticated: () => Boolean(get().accessToken),
      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    {
      name: 'mars-auth',
      // Never let a bearer token reach disk.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
