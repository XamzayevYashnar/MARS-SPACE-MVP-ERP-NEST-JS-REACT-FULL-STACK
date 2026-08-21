/** Response envelopes — the fixed API contract (spec §7.1). */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  path: string;
  timestamp: string;
}

/**
 * Normalised error thrown by the axios layer so callers get a typed shape
 * regardless of whether the failure was an HTTP error, a network error, or a
 * timeout.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ApiErrorDetail[];

  constructor(params: {
    code: string;
    message: string;
    statusCode: number;
    details?: ApiErrorDetail[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;
  }
}

/** A page of results plus its pagination meta, as surfaced to hooks. */
export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Common list query params accepted across endpoints. */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
