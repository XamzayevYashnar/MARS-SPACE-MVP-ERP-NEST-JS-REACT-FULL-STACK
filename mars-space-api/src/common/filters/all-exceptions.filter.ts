import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes';
import { DomainException, ErrorDetail } from '../exceptions';

interface ErrorEnvelope {
  success: false;
  statusCode: number;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
  path: string;
  timestamp: string;
}

/**
 * The single exit point for every failed request.
 *
 * It normalises domain exceptions, Nest HTTP exceptions and unexpected
 * throwables into the error envelope of §6.1. Prisma errors are handled
 * earlier by `PrismaExceptionFilter`, which is registered after this one
 * (Nest applies global filters right-to-left, so the more specific filter wins).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const envelope = this.toEnvelope(exception, request.url);

    if (envelope.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Only unexpected failures deserve a stack trace in the logs.
      this.logger.error(
        `${request.method} ${request.url} → ${envelope.statusCode} ${envelope.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${envelope.statusCode} ${envelope.error.code}: ${envelope.error.message}`,
      );
    }

    response.status(envelope.statusCode).json(envelope);
  }

  private toEnvelope(exception: unknown, path: string): ErrorEnvelope {
    const timestamp = new Date().toISOString();

    if (exception instanceof DomainException) {
      return {
        success: false,
        statusCode: exception.statusCode,
        error: { code: exception.code, message: exception.message, details: exception.details },
        path,
        timestamp,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests, please slow down and try again shortly',
        },
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      return {
        success: false,
        statusCode,
        error: {
          code: this.codeForStatus(statusCode, payload),
          message: this.messageFrom(payload, exception.message),
          details: this.detailsFrom(payload),
        },
        path,
        timestamp,
      };
    }

    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Internal server error' },
      path,
      timestamp,
    };
  }

  /**
   * Turns a Terminus failure payload into one detail per broken indicator.
   * Returns null for anything that is not a health-check body.
   */
  private terminusFailures(record: Record<string, unknown>): ErrorDetail[] | null {
    if (record['status'] !== 'error') {
      return null;
    }

    const failures = record['error'];
    if (typeof failures !== 'object' || failures === null || Array.isArray(failures)) {
      return null;
    }

    const entries = Object.entries(failures as Record<string, unknown>).map(([field, value]) => {
      const message =
        typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)['message']
          : undefined;
      return { field, message: typeof message === 'string' ? message : 'is unavailable' };
    });

    return entries.length > 0 ? entries : null;
  }

  /** Nest bodies are `string | object`; narrow before reading properties. */
  private asRecord(payload: string | object): Record<string, unknown> | null {
    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  }

  private codeForStatus(statusCode: number, payload: string | object): ErrorCode {
    // A use case may hand a code through when it throws an HttpException directly.
    const explicit = this.asRecord(payload)?.['code'];
    if (typeof explicit === 'string' && explicit in ERROR_CODES) {
      return explicit as ErrorCode;
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return ERROR_CODES.FILE_TOO_LARGE;
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return ERROR_CODES.UNSUPPORTED_FILE_TYPE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return statusCode >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.VALIDATION_ERROR;
    }
  }

  private messageFrom(payload: string | object, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }

    const message = this.asRecord(payload)?.['message'];
    if (typeof message === 'string') {
      return message;
    }
    // The default ValidationPipe puts an array of strings here; the structured
    // per-field breakdown lives in `details` instead.
    if (Array.isArray(message)) {
      return 'Validation failed';
    }

    return fallback;
  }

  private detailsFrom(payload: string | object): ErrorDetail[] | undefined {
    const record = this.asRecord(payload);
    if (!record) {
      return undefined;
    }

    // Terminus reports a failed health check as
    // `{ status: 'error', error: { <indicator>: { status, message } } }`.
    // Without this branch a 503 arrived as a bare "Service Unavailable
    // Exception" and the operator could not tell which dependency was down.
    const failedChecks = this.terminusFailures(record);
    if (failedChecks) {
      return failedChecks;
    }

    const details = record['details'];
    if (Array.isArray(details)) {
      return details as ErrorDetail[];
    }

    const message = record['message'];
    if (Array.isArray(message)) {
      return message
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => ({ field: entry.split(' ')[0] ?? 'unknown', message: entry }));
    }

    return undefined;
  }
}
