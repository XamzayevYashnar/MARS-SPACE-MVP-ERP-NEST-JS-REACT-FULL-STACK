import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { DomainException } from '../../../../common/exceptions';

/** Presented refresh token is unknown, already used, revoked or expired. */
export class InvalidRefreshTokenError extends DomainException {
  constructor(message = 'Refresh token is invalid or has expired') {
    super(message, ERROR_CODES.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
  }
}

/** `currentPassword` did not match on `PATCH /auth/change-password`. */
export class IncorrectCurrentPasswordError extends DomainException {
  constructor() {
    super(
      'Current password is incorrect',
      ERROR_CODES.INVALID_CREDENTIALS,
      HttpStatus.UNAUTHORIZED,
    );
  }
}
