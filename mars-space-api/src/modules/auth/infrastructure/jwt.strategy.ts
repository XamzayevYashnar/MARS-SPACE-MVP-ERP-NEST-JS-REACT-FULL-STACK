import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { AuthenticatedUser, JwtPayload } from '../../../common/interfaces';
import { JwtConfig } from '../../../core/config/jwt.config';
import { UserRepository } from '../../users/domain/repositories/user.repository';

/**
 * Validates the bearer access token and resolves it to the user attached to
 * `request.user`.
 *
 * The database lookup is deliberate: a token issued before an account was
 * deactivated or demoted must stop working immediately, which a signature check
 * alone cannot enforce.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<JwtConfig>('jwt').accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.canAuthenticate()) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'This session is no longer valid',
      });
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
