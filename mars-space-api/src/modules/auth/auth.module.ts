import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { RefreshTokenCleanupService } from './infrastructure/refresh-token-cleanup.service';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [
    { provide: RefreshTokenRepository, useClass: PrismaRefreshTokenRepository },
    JwtStrategy,
    RefreshTokenCleanupService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    GetProfileUseCase,
  ],
  // Exported for `UsersModule`, which revokes sessions on demotion/deactivation.
  exports: [RefreshTokenRepository],
})
export class AuthModule {}
