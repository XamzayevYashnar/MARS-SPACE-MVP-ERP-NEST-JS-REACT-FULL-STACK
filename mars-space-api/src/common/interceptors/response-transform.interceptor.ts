import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { PaginationMeta } from '../interfaces';

/** Shape a use case returns when the response carries pagination. */
export interface PaginatedPayload<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface SuccessEnvelope<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

function isPaginated(value: unknown): value is PaginatedPayload<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record['items']) && typeof record['meta'] === 'object' && record['meta'] !== null
  );
}

/**
 * Wraps every successful response in the envelope of §6.1.
 *
 * Controllers therefore return plain response DTOs; when a use case returns a
 * `{ items, meta }` pair the interceptor lifts `meta` out to the envelope root
 * so clients always read pagination from the same place.
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessEnvelope<unknown>
> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessEnvelope<unknown>> {
    const statusCode = context.switchToHttp().getResponse<Response>().statusCode;

    return next.handle().pipe(
      map((payload) => {
        const timestamp = new Date().toISOString();

        if (isPaginated(payload)) {
          return {
            success: true as const,
            statusCode,
            data: payload.items,
            meta: payload.meta,
            timestamp,
          };
        }

        return { success: true as const, statusCode, data: payload ?? null, timestamp };
      }),
    );
  }
}
