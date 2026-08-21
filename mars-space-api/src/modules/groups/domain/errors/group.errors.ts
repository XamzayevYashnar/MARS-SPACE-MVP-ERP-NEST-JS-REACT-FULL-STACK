import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { DomainException } from '../../../../common/exceptions';

/**
 * §6.4.2 — enrolling into a group that has no free seat.
 *
 * It carries its own error code so the admin UI can distinguish "the group is
 * full" from any other conflict and offer to pick a different intake.
 */
export class GroupCapacityExceededError extends DomainException {
  constructor(groupName: string, capacity: number) {
    super(
      `Group "${groupName}" is already at its capacity of ${capacity} students`,
      ERROR_CODES.GROUP_CAPACITY_EXCEEDED,
      HttpStatus.CONFLICT,
    );
  }
}

/** The intake has finished or was cancelled, so it takes no new students. */
export class GroupClosedForEnrolmentError extends DomainException {
  constructor(groupName: string, status: string) {
    super(
      `Group "${groupName}" is ${status} and no longer accepts new students`,
      ERROR_CODES.CONFLICT,
      HttpStatus.CONFLICT,
    );
  }
}
