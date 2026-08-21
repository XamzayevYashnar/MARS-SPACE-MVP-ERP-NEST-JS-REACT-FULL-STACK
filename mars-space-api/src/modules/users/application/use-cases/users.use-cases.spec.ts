import { UserRole } from '@prisma/client';
import { BusinessRuleException } from '../../../../common/exceptions';
import { HashingService } from '../../../../core/security/hashing.service';
import { RefreshTokenRepository } from '../../../auth/domain/repositories/refresh-token.repository';
import { User } from '../../domain/entities/user.entity';
import {
  LastSuperAdminError,
  UserEmailTakenError,
  UserNotFoundError,
} from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';
import { CreateUserUseCase } from './create-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { GetUserUseCase } from './get-user.use-case';
import { ListUsersUseCase } from './list-users.use-case';
import { UpdateUserStatusUseCase } from './update-user-status.use-case';
import { UpdateUserUseCase } from './update-user.use-case';

function buildUser(overrides: Partial<User> = {}): User {
  return new User(
    overrides.id ?? 'user-1',
    overrides.fullName ?? 'Mars Admin',
    overrides.email ?? 'admin@marsspace.uz',
    overrides.phone ?? null,
    overrides.passwordHash ?? 'stored-hash',
    overrides.role ?? UserRole.ADMIN,
    overrides.avatarUrl ?? null,
    overrides.isActive ?? true,
    overrides.lastLoginAt ?? null,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

function buildUserRepository(): jest.Mocked<UserRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildUser()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildUser()),
    findByEmail: jest.fn().mockResolvedValue(null),
    existsByEmail: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockImplementation(async (data) => buildUser({ email: data.email })),
    update: jest.fn().mockResolvedValue(buildUser()),
    delete: jest.fn().mockResolvedValue(undefined),
    touchLastLogin: jest.fn().mockResolvedValue(undefined),
    countByRole: jest.fn().mockResolvedValue(3),
  } as unknown as jest.Mocked<UserRepository>;
}

function buildRefreshTokenRepository(): jest.Mocked<RefreshTokenRepository> {
  return {
    revokeAllForUser: jest.fn().mockResolvedValue(2),
    revokeAllForUserExcept: jest.fn().mockResolvedValue(1),
  } as unknown as jest.Mocked<RefreshTokenRepository>;
}

describe('CreateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let hashingService: jest.Mocked<HashingService>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = buildUserRepository();
    hashingService = {
      hash: jest.fn().mockResolvedValue('argon2-hash'),
    } as unknown as jest.Mocked<HashingService>;
    useCase = new CreateUserUseCase(userRepository, hashingService);
  });

  it('hashes the password and never stores the plaintext', async () => {
    await useCase.execute({
      fullName: 'Yangi Admin',
      email: 'new@marsspace.uz',
      password: 'Str0ngPass!',
      role: UserRole.ADMIN,
    });

    expect(hashingService.hash).toHaveBeenCalledWith('Str0ngPass!');
    const created = userRepository.create.mock.calls[0][0];
    expect(created.passwordHash).toBe('argon2-hash');
    expect(JSON.stringify(created)).not.toContain('Str0ngPass!');
  });

  it('lowercases the email', async () => {
    await useCase.execute({
      fullName: 'Yangi',
      email: '  NEW@MarsSpace.UZ  ',
      password: 'Str0ngPass!',
      role: UserRole.ADMIN,
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@marsspace.uz' }),
    );
  });

  it('never returns the hash in the response', async () => {
    const result = await useCase.execute({
      fullName: 'Yangi',
      email: 'new@marsspace.uz',
      password: 'Str0ngPass!',
      role: UserRole.ADMIN,
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email with the offending field named', async () => {
    userRepository.existsByEmail.mockResolvedValue(true);

    await expect(
      useCase.execute({
        fullName: 'Yangi',
        email: 'admin@marsspace.uz',
        password: 'Str0ngPass!',
        role: UserRole.ADMIN,
      }),
    ).rejects.toThrow(UserEmailTakenError);
  });
});

describe('UpdateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    userRepository = buildUserRepository();
    refreshTokenRepository = buildRefreshTokenRepository();
    useCase = new UpdateUserUseCase(userRepository, refreshTokenRepository);
  });

  it('404s on an unknown user', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { fullName: 'X' })).rejects.toThrow(UserNotFoundError);
  });

  it('revokes live sessions when the role changes', async () => {
    await useCase.execute('user-1', { role: UserRole.MANAGER });

    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('revokes live sessions when the account is deactivated', async () => {
    await useCase.execute('user-1', { isActive: false });

    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('leaves sessions alone for an unrelated edit', async () => {
    await useCase.execute('user-1', { fullName: 'Yangi ism' });

    expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('refuses to demote the last super admin', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ role: UserRole.SUPER_ADMIN }));
    userRepository.countByRole.mockResolvedValue(1);

    await expect(useCase.execute('user-1', { role: UserRole.ADMIN })).rejects.toThrow(
      LastSuperAdminError,
    );
  });

  it('allows demoting a super admin while another remains', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ role: UserRole.SUPER_ADMIN }));
    userRepository.countByRole.mockResolvedValue(2);

    await expect(useCase.execute('user-1', { role: UserRole.ADMIN })).resolves.toBeDefined();
  });

  it('rejects an email taken by another account', async () => {
    userRepository.existsByEmail.mockResolvedValue(true);

    await expect(useCase.execute('user-1', { email: 'taken@marsspace.uz' })).rejects.toThrow(
      UserEmailTakenError,
    );
  });
});

describe('UpdateUserStatusUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let useCase: UpdateUserStatusUseCase;

  beforeEach(() => {
    userRepository = buildUserRepository();
    refreshTokenRepository = buildRefreshTokenRepository();
    useCase = new UpdateUserStatusUseCase(userRepository, refreshTokenRepository);
  });

  it('ends live sessions when deactivating', async () => {
    await useCase.execute('user-1', false);

    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('does not touch sessions when reactivating', async () => {
    await useCase.execute('user-1', true);

    expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('refuses to deactivate the last super admin', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ role: UserRole.SUPER_ADMIN }));
    userRepository.countByRole.mockResolvedValue(1);

    await expect(useCase.execute('user-1', false)).rejects.toThrow(LastSuperAdminError);
  });
});

describe('DeleteUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    userRepository = buildUserRepository();
    useCase = new DeleteUserUseCase(userRepository);
  });

  it('deletes another account', async () => {
    await useCase.execute('user-1', 'someone-else');

    expect(userRepository.delete).toHaveBeenCalledWith('user-1');
  });

  it('refuses to let the caller delete themselves out of the system', async () => {
    await expect(useCase.execute('user-1', 'user-1')).rejects.toThrow(BusinessRuleException);
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete the last super admin', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ role: UserRole.SUPER_ADMIN }));
    userRepository.countByRole.mockResolvedValue(1);

    await expect(useCase.execute('user-1', 'other')).rejects.toThrow(LastSuperAdminError);
  });

  it('404s on an unknown account', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', 'other')).rejects.toThrow(UserNotFoundError);
  });
});

describe('GetUserUseCase and ListUsersUseCase', () => {
  it('returns a profile without the hash', async () => {
    const repository = buildUserRepository();

    const result = await new GetUserUseCase(repository).execute('user-1');

    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe('admin@marsspace.uz');
  });

  it('404s on an unknown id', async () => {
    const repository = buildUserRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new GetUserUseCase(repository).execute('ghost')).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it('passes the role and status filters through', async () => {
    const repository = buildUserRepository();

    await new ListUsersUseCase(repository).execute({ role: UserRole.MANAGER, isActive: true });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.MANAGER, isActive: true }),
    );
  });

  it('strips the hash from every row of a listing', async () => {
    const repository = buildUserRepository();

    const result = await new ListUsersUseCase(repository).execute({});

    expect(JSON.stringify(result)).not.toContain('stored-hash');
  });
});
