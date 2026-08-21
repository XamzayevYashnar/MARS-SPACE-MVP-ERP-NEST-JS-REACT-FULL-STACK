import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes';
import { DomainException } from './domain.exception';

/**
 * 409 — the request is well-formed but conflicts with a business invariant
 * (deleting a category that still holds courses, converting a lead twice, ...).
 */
export class BusinessRuleException extends DomainException {
  constructor(message: string, code: ErrorCode = ERROR_CODES.CONFLICT) {
    super(message, code, HttpStatus.CONFLICT);
  }
}
