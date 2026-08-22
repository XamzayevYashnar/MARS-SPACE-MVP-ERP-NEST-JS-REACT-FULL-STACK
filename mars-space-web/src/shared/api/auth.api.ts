import { http } from './axios-instance';
import { endpoints } from './endpoints';
import type { AuthUser } from '@/store/auth.store';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export const authApi = {
  login: (input: LoginInput) => http.post<LoginResponse>(endpoints.auth.login, input),
  logout: () => http.post<{ message: string }>(endpoints.auth.logout),
  me: () => http.get<AuthUser>(endpoints.auth.me),
  /**
   * Trades the httpOnly refresh cookie for a fresh access token. Used on boot
   * to restore a session the access token no longer survives (it is memory-only).
   */
  refresh: () => http.post<RefreshResponse>(endpoints.auth.refresh),
};
