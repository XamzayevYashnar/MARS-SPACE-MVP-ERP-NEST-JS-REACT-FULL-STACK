import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes';
import { ErrorDetail } from '../exceptions';

/**
 * Translates the Prisma error codes named in §6.1 into the HTTP envelope.
 *
 * Anything the repository layer failed to guard against still reaches the
 * client as a meaningful status instead of a bare 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message, details } = this.translate(exception);

    this.logger.warn(`${request.method} ${request.url} → ${statusCode} ${code}: ${message}`);

    response.status(statusCode).json({
      success: false,
      statusCode,
      error: { code, message, details },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private translate(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
  ): {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  } {
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'The request could not be applied to the database schema',
      };
    }

    switch (exception.code) {
      // Unique constraint failed.
      case 'P2002': {
        const fields = this.targetFields(exception);
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ERROR_CODES.ALREADY_EXISTS,
          message: fields.length
            ? `A record with this ${fields.join(', ')} already exists`
            : 'A record with these values already exists',
          details: fields.map((field) => ({ field, message: `${field} must be unique` })),
        };
      }

      // An operation failed because the record was not found.
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: ERROR_CODES.NOT_FOUND,
          message: 'The requested record was not found',
        };

      // Foreign key constraint failed — a referenced row is missing or still in use.
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ERROR_CODES.CONFLICT,
          message: 'The operation conflicts with a related record',
          details: this.targetFields(exception).map((field) => ({
            field,
            message: 'references a record that does not exist or is still in use',
          })),
        };

      // Required relation violation — e.g. deleting a parent that still has children.
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ERROR_CODES.CONFLICT,
          message: 'The change would break a required relation between records',
        };

      default:
        this.logger.error(`Unmapped Prisma error ${exception.code}: ${exception.message}`);
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        };
    }
  }

  /** `meta.target` is `string | string[] | undefined` depending on the driver. */
  private targetFields(exception: Prisma.PrismaClientKnownRequestError): string[] {
    const target = exception.meta?.['target'];
    if (Array.isArray(target)) {
      return target.filter((field): field is string => typeof field === 'string');
    }
    if (typeof target === 'string') {
      return [target];
    }

    const fieldName = exception.meta?.['field_name'];
    return typeof fieldName === 'string' ? [fieldName] : [];
  }
}
