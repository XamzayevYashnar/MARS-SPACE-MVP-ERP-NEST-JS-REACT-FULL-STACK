import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';
import { DomainException } from './domain.exception';

/** 409 — a unique constraint (slug, email, group name) would be violated. */
export class EntityAlreadyExistsException extends DomainException {
  constructor(entity: string, field: string, value: string) {
    super(
      `${entity} with ${field} "${value}" already exists`,
      ERROR_CODES.ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      [{ field, message: `${field} must be unique` }],
    );
  }
}
