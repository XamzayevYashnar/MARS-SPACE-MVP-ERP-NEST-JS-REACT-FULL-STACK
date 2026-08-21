import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../constants/app.constants';
import { ERROR_CODES } from '../constants/error-codes';
import { AuthenticatedUser } from '../interfaces';

/**
 * Registered globally through `APP_GUARD` (§7); routes decorated with
 * `@Public()` skip it. Distinguishing an expired token from a missing one lets
 * the client know it should refresh rather than send the user back to login.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false,
    info: unknown,
  ): TUser {
    // Passport hands the underlying jsonwebtoken error through `info`. Matching
    // on the name keeps this free of a direct jsonwebtoken dependency.
    if (info instanceof Error && info.name === 'TokenExpiredError') {
      throw new UnauthorizedException({
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Access token has expired',
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication is required to access this resource',
      });
    }

    return user;
  }
}
