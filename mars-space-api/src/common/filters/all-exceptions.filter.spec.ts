import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';
import { EntityNotFoundException } from '../exceptions';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface CapturedResponse {
  statusCode: number;
  body: {
    success: false;
    statusCode: number;
    error: { code: string; message: string; details?: { field: string; message: string }[] };
    path: string;
    timestamp: string;
  };
}

/** Minimal ArgumentsHost that records what the filter wrote. */
function hostFor(captured: Partial<CapturedResponse>): ArgumentsHost {
  const response = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(body: CapturedResponse['body']) {
      captured.body = body;
      return this;
    },
  };

  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/health/ready', method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;
}

function run(exception: unknown): CapturedResponse {
  const captured: Partial<CapturedResponse> = {};
  new AllExceptionsFilter().catch(exception, hostFor(captured));
  return captured as CapturedResponse;
}

describe('AllExceptionsFilter', () => {
  beforeAll(() => {
    // The filter logs every 5xx with its stack. That is the behaviour under
    // test elsewhere, but here it would bury the results in noise.
    Logger.overrideLogger(false);
  });

  afterAll(() => {
    Logger.overrideLogger(console);
  });

  it('passes a domain exception through with its own code and status', () => {
    const result = run(new EntityNotFoundException('Course', 'abc'));

    expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(result.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(result.body.success).toBe(false);
  });

  it('maps a Nest HttpException onto the matching error code', () => {
    const result = run(new ForbiddenException());

    expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(result.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it('turns the ValidationPipe message array into per-field details', () => {
    const result = run(
      new BadRequestException({ message: ['email must be an email', 'phone should not be empty'] }),
    );

    expect(result.body.error.message).toBe('Validation failed');
    expect(result.body.error.details).toEqual([
      { field: 'email', message: 'email must be an email' },
      { field: 'phone', message: 'phone should not be empty' },
    ]);
  });

  describe('service unavailable', () => {
    // A failed readiness probe is a dependency outage, not a bug in the
    // request — reporting it as INTERNAL_ERROR sends clients down the wrong
    // path, because one is worth retrying and the other is not.
    it('reports 503 as SERVICE_UNAVAILABLE rather than INTERNAL_ERROR', () => {
      const result = run(new ServiceUnavailableException());

      expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    });

    it('names the health indicator that failed', () => {
      const result = run(
        new ServiceUnavailableException({
          status: 'error',
          info: {},
          error: { database: { status: 'down', message: 'Connection refused' } },
          details: { database: { status: 'down', message: 'Connection refused' } },
        }),
      );

      expect(result.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(result.body.error.details).toEqual([
        { field: 'database', message: 'Connection refused' },
      ]);
    });

    it('falls back to a generic reason when the indicator carries no message', () => {
      const result = run(
        new ServiceUnavailableException({ status: 'error', error: { database: {} } }),
      );

      expect(result.body.error.details).toEqual([{ field: 'database', message: 'is unavailable' }]);
    });
  });

  it('never leaks the internals of an unexpected throwable', () => {
    const result = run(new Error('connection string postgres://user:hunter2@db/app'));

    expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(result.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(result.body.error.message).toBe('Internal server error');
    expect(JSON.stringify(result.body)).not.toContain('hunter2');
  });

  it('keeps an explicit code handed through on an HttpException', () => {
    const result = run(
      new HttpException(
        { code: ERROR_CODES.TOKEN_EXPIRED, message: 'Access token has expired' },
        HttpStatus.UNAUTHORIZED,
      ),
    );

    expect(result.body.error.code).toBe(ERROR_CODES.TOKEN_EXPIRED);
    expect(result.body.error.message).toBe('Access token has expired');
  });
});
