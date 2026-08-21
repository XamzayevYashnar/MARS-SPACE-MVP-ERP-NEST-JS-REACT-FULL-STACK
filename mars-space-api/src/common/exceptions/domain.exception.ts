import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes';

export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Base class for every error raised by the domain and application layers.
 *
 * Domain code stays framework-free by throwing these instead of Nest's
 * `HttpException`; `AllExceptionsFilter` is the single place that turns them
 * into the HTTP error envelope of §6.1.
 */
export class DomainException extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: ErrorDetail[];

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HttpStatus.BAD_REQUEST,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}
