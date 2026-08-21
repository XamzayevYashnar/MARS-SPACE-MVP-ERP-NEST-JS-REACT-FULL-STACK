import { UserRole } from '@prisma/client';
import { HashingService } from '../../../../core/security/hashing.service';
import { TokenService } from '../../../../core/security/token.service';
import { User } from '../../../users/domain/entities/user.entity';
import {
  AccountDeactivatedError,
  InvalidCredentialsError,
} from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { LoginUseCase } from './login.use-case';

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

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let hashingService: jest.Mocked<HashingService>;
  let tokenService: jest.Mocked<TokenService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      touchLastLogin: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserRepository>;

    refreshTokenRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    hashingService = { verify: jest.fn() } as unknown as jest.Mocked<HashingService>;

    tokenService = {
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      createRefreshToken: jest.fn().mockReturnValue({
        token: 'refresh-token',
        tokenHash: 'refresh-hash',
        expiresAt: new Date('2026-02-01'),
      }),
      accessTtlSeconds: jest.fn().mockReturnValue(900),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new LoginUseCase(
      userRepository,
      refreshTokenRepository,
      hashingService,
      tokenService,
    );
  });

  it('issues a token pair for valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    hashingService.verify.mockResolvedValue(true);

    const result = await useCase.execute(
      { email: 'admin@marsspace.uz', password: 'ChangeMe123!' },
      { userAgent: 'jest', ipAddress: '127.0.0.1' },
    );

    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      tokenType: 'Bearer',
    });
    expect(result.user.email).toBe('admin@marsspace.uz');
  });

  it('never exposes the password hash in the response', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser({ passwordHash: 'super-secret' }));
    hashingService.verify.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'admin@marsspace.uz', password: 'x' });

    expect(JSON.stringify(result)).not.toContain('super-secret');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('persists the refresh session with its hash and request context', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    hashingService.verify.mockResolvedValue(true);

    await useCase.execute(
      { email: 'admin@marsspace.uz', password: 'x' },
      { userAgent: 'jest', ipAddress: '10.0.0.1' },
    );

    expect(refreshTokenRepository.create).toHaveBeenCalledWith({
      tokenHash: 'refresh-hash',
      userId: 'user-1',
      userAgent: 'jest',
      ipAddress: '10.0.0.1',
      expiresAt: new Date('2026-02-01'),
    });
  });

  it('records the login timestamp', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    hashingService.verify.mockResolvedValue(true);

    await useCase.execute({ email: 'admin@marsspace.uz', password: 'x' });

    expect(userRepository.touchLastLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
  });

  it('rejects a wrong password', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    hashingService.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'admin@marsspace.uz', password: 'nope' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('reports an unknown email as invalid credentials, not as a missing account', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    hashingService.verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'ghost@marsspace.uz', password: 'x' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('still hashes when the account does not exist, so timing does not leak enumeration', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    hashingService.verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'ghost@marsspace.uz', password: 'x' })).rejects.toThrow();

    expect(hashingService.verify).toHaveBeenCalledTimes(1);
  });

  it('refuses a deactivated account even with the right password', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser({ isActive: false }));
    hashingService.verify.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'admin@marsspace.uz', password: 'ChangeMe123!' }),
    ).rejects.toThrow(AccountDeactivatedError);
  });
});
