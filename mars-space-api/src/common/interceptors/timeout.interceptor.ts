import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';

const DEFAULT_TIMEOUT_MS = 15_000;

/** Fails a request that outlives the budget instead of holding the socket open. */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error: unknown) =>
        throwError(() =>
          error instanceof TimeoutError ? new RequestTimeoutException('Request timed out') : error,
        ),
      ),
    );
  }
}
