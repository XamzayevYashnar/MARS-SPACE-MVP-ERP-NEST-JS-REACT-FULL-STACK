import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';
import { DomainException } from './domain.exception';

/** 404 — the requested aggregate does not exist (or is not visible publicly). */
export class EntityNotFoundException extends DomainException {
  constructor(entity: string, identifier?: string) {
    super(
      identifier
        ? `${entity} with identifier "${identifier}" was not found`
        : `${entity} was not found`,
      ERROR_CODES.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
  }
}
