import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/app.constants';
import { AuthenticatedUser } from '../interfaces';

/**
 * Opts a route out of the globally registered `JwtAuthGuard`.
 * Every public route of §6.3 carries it.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Restricts a route to the listed roles. `SUPER_ADMIN` implicitly passes every
 * check, so it never has to be listed (§7).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Injects the user `JwtStrategy` attached to the request. */
export const CurrentUser = createParamDecorator(
  (property: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return property ? user[property] : user;
  },
);
