import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';
import { DomainException } from './domain.exception';

/**
 * 422 — the phone number could not be normalised to `+998XXXXXXXXX` (§6.4.6).
 *
 * Raised by the use cases rather than the DTO because the value is normalised
 * first (`90 123 45 67` is accepted), so validity is only known after that step.
 */
export class InvalidPhoneException extends DomainException {
  constructor(field = 'phone') {
    super(
      'Phone number is not a valid Uzbek number',
      ERROR_CODES.VALIDATION_ERROR,
      HttpStatus.UNPROCESSABLE_ENTITY,
      [{ field, message: 'phone must match +998XXXXXXXXX' }],
    );
  }
}
