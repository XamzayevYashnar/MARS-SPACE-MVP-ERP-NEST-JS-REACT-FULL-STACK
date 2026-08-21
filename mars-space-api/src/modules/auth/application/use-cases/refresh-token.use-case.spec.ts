import { UserRole } from '@prisma/client';
import { TokenService } from '../../../../core/security/token.service';
import { User } from '../../../users/domain/entities/user.entity';
import { AccountDeactivatedError } from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { RefreshTokenUseCase } from './refresh-token.use-case';

const activeUser = new User(
  'user-1',
  'Mars Admin',
  'admin@marsspace.uz',
  null,
  'hash',
  UserRole.ADMIN,
  null,
  true,
  null,
  new Date('2026-01-01'),
  new Date('2026-01-01'),
);

function storedToken(overrides: { expiresAt?: Date; revokedAt?: Date | null } = {}): RefreshToken {
  return new RefreshToken(
    'session-1',
    'presented-hash',
    'user-1',
    'jest',
    '127.0.0.1',
    overrides.expiresAt ?? new Date(Date.now() + 86_400_000),
    overrides.revokedAt ?? null,
    new Date('2026-01-01'),
  );
}

describe('RefreshTokenUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    userRepository = { findById: jest.fn() } as unknown as jest.Mocked<UserRepository>;

    refreshTokenRepository = {
      findByHash: jest.fn(),
      revoke: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    tokenService = {
      hashRefreshToken: jest.fn().mockReturnValue('presented-hash'),
      issueAccessToken: jest.fn().mockResolvedValue('new-access-token'),
      createRefreshToken: jest.fn().mockReturnValue({
        token: 'new-refresh-token',
        tokenHash: 'new-hash',
        expiresAt: new Date('2026-03-01'),
      }),
      accessTtlSeconds: jest.fn().mockReturnValue(900),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new RefreshTokenUseCase(userRepository, refreshTokenRepository, tokenService);
  });

  it('rotates the session: the presented token is revoked and a new pair issued', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(storedToken());
    userRepository.findById.mockResolvedValue(activeUser);

    const result = await useCase.execute('presented-token');

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('session-1');
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'new-hash', userId: 'user-1' }),
    );
    expect(result).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('looks the session up by hash, never by the raw token', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(storedToken());
    userRepository.findById.mockResolvedValue(activeUser);

    await useCase.execute('presented-token');

    expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('presented-token');
    expect(refreshTokenRepository.findByHash).toHaveBeenCalledWith('presented-hash');
  });

  it('rejects an unknown token', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(null);

    await expect(useCase.execute('bogus')).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects a token that was already rotated away', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(
      storedToken({ revokedAt: new Date('2026-01-02') }),
    );

    await expect(useCase.execute('replayed')).rejects.toThrow(InvalidRefreshTokenError);
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(useCase.execute('stale')).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('revokes every session when the account has been deactivated', async () => {
    refreshTokenRepository.findByHash.mockResolvedValue(storedToken());
    userRepository.findById.mockResolvedValue(
      new User(
        'user-1',
        'Mars Admin',
        'admin@marsspace.uz',
        null,
        'hash',
        UserRole.ADMIN,
        null,
        false,
        null,
        new Date('2026-01-01'),
        new Date('2026-01-01'),
      ),
    );

    await expect(useCase.execute('presented-token')).rejects.toThrow(AccountDeactivatedError);
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
