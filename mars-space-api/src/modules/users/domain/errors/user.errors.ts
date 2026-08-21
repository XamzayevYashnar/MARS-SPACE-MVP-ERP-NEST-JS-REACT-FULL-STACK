import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import {
  BusinessRuleException,
  DomainException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';

export class UserNotFoundError extends EntityNotFoundException {
  constructor(identifier?: string) {
    super('User', identifier);
  }
}

export class UserEmailTakenError extends EntityAlreadyExistsException {
  constructor(email: string) {
    super('User', 'email', email);
  }
}

/** Raised by login and refresh; deliberately vague about which half was wrong. */
export class InvalidCredentialsError extends DomainException {
  constructor(message = 'Email or password is incorrect') {
    super(message, ERROR_CODES.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountDeactivatedError extends DomainException {
  constructor() {
    super(
      'This account has been deactivated. Contact a super admin.',
      ERROR_CODES.FORBIDDEN,
      HttpStatus.FORBIDDEN,
    );
  }
}

/** Guards the invariant that the system always retains one usable owner. */
export class LastSuperAdminError extends BusinessRuleException {
  constructor(action: string) {
    super(`Cannot ${action} the last remaining SUPER_ADMIN account`);
  }
}
