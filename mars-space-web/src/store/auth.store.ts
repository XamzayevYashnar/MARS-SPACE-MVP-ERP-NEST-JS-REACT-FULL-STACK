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
  setSession: (params: { accessToken: string; user: AuthUser }) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

/**
 * Auth session (spec §7.3). The access token is kept here (persisted so a
 * reload keeps the user signed in); the refresh token lives in an httpOnly
 * cookie and is never touched by JS.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearSession: () => set({ accessToken: null, user: null }),
      isAuthenticated: () => Boolean(get().accessToken),
      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    { name: 'mars-auth' },
  ),
);
