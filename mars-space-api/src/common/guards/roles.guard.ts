import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/app.constants';
import { ERROR_CODES } from '../constants/error-codes';
import { ROLE_RANK } from '../enums/role-rank';
import { AuthenticatedUser } from '../interfaces';

/**
 * Enforces `@Roles(...)`. Registered globally right after `JwtAuthGuard`, so by
 * the time it runs a non-public request already carries an authenticated user.
 *
 * §6.3 lists a *minimum* role per resource, so the check is a rank comparison
 * rather than set membership: `@Roles(MANAGER)` admits MANAGER, ADMIN and
 * SUPER_ADMIN, while `@Roles(SUPER_ADMIN)` admits only SUPER_ADMIN. Listing
 * several roles takes the lowest rank among them as the bar.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have permission to perform this action',
      });
    }

    const minimumRank = Math.min(...requiredRoles.map((role) => ROLE_RANK[role]));

    if (ROLE_RANK[user.role] >= minimumRank) {
      return true;
    }

    const minimumRole = requiredRoles.reduce((lowest, role) =>
      ROLE_RANK[role] < ROLE_RANK[lowest] ? role : lowest,
    );

    throw new ForbiddenException({
      code: ERROR_CODES.FORBIDDEN,
      message: `This action requires the ${minimumRole} role or higher`,
    });
  }
}
