import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/shared/config/env';
import { endpoints } from './endpoints';
import { ApiError, type ApiErrorBody, type ApiResponse, type Page } from '@/shared/types/api.types';
import { useAuthStore } from '@/store/auth.store';

/** Emitted when the session cannot be recovered; ProtectedRoute redirects. */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true, // refresh token travels in an httpOnly cookie
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach the access token ────────────────────────────────
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: unwrap the envelope + refresh-on-401 queue ─────────────
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
/** Requests parked while one refresh is in flight; each rejects as an ApiError. */
let queue: { resolve: (token: string) => void; reject: () => void }[] = [];

function flushQueue(token: string | null) {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject()));
  queue = [];
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  const body = error.response?.data;
  if (body && typeof body === 'object' && 'error' in body) {
    return new ApiError({
      code: body.error.code,
      message: body.error.message,
      statusCode: body.statusCode,
      details: body.error.details,
    });
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError({ code: 'TIMEOUT', message: 'Request timed out', statusCode: 408 });
  }
  return new ApiError({
    code: 'NETWORK_ERROR',
    message: error.message || 'Network error',
    statusCode: error.response?.status ?? 0,
  });
}

axiosInstance.interceptors.response.use(
  (response) => {
    // Lift `meta` onto the response so getPage can read it, then unwrap `data`.
    const envelope = response.data as ApiResponse<unknown> | undefined;
    if (envelope && typeof envelope === 'object' && 'data' in envelope) {
      (response as { meta?: unknown }).meta = envelope.meta;
      response.data = envelope.data;
    }
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    const isRefreshCall = original?.url?.includes(endpoints.auth.refresh);

    // Silent refresh on an expired access token (spec §7.3).
    if (status === 401 && code === 'TOKEN_EXPIRED' && original && !original._retry && !isRefreshCall) {
      if (isRefreshing) {
        // Queue until the in-flight refresh resolves, then replay.
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              // Mark the replay as a retry too. Without this a queued request
              // that still 401s would start a *second* refresh round instead of
              // failing, so a genuinely dead session could loop.
              original._retry = true;
              original.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(original));
            },
            // Callers only ever handle ApiError; handing them the raw Axios
            // error here made queued failures a different shape from the
            // leader's, which `getApiErrorMessage` could not read.
            reject: () => reject(toApiError(error)),
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const refreshRes = await axiosInstance.post<ApiResponse<{ accessToken: string }>>(
          endpoints.auth.refresh,
        );
        // Response interceptor already unwrapped `data`.
        const { accessToken } = refreshRes.data as unknown as { accessToken: string };
        useAuthStore.getState().setAccessToken(accessToken);
        flushQueue(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch {
        flushQueue(null);
        useAuthStore.getState().clearSession();
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
        return Promise.reject(toApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  },
);

// ── Typed helpers: hooks import these, never axios directly ──────────
export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.get<T>(url, config);
    return res.data;
  },
  /** GET a paginated list; returns items + pagination meta from the envelope. */
  async getPage<T>(url: string, config?: AxiosRequestConfig): Promise<Page<T>> {
    const res = await axiosInstance.get<T[]>(url, config);
    const meta = (res as { meta?: Page<T>['meta'] }).meta;
    return {
      items: res.data,
      meta: meta ?? {
        page: 1,
        limit: res.data.length,
        total: res.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.post<T>(url, body, config);
    return res.data;
  },
  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.put<T>(url, body, config);
    return res.data;
  },
  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.patch<T>(url, body, config);
    return res.data;
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosInstance.delete<T>(url, config);
    return res.data;
  },
};

export { axiosInstance };
