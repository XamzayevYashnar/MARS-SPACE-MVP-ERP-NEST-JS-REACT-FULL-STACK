import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserStatusUseCase } from './application/use-cases/update-user-status.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersAdminController } from './presentation/users.admin.controller';

/**
 * `AuthModule` is imported for `RefreshTokenRepository`: role changes and
 * deactivations must revoke live sessions. The pair is circular by nature —
 * auth needs `UserRepository` — so both sides use `forwardRef`.
 */
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersAdminController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    ListUsersUseCase,
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdateUserStatusUseCase,
    DeleteUserUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
