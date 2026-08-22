import { CreateRefreshTokenData, RefreshToken } from '../entities/refresh-token.entity';

/** Port for refresh-session persistence. */
export abstract class RefreshTokenRepository {
  abstract create(data: CreateRefreshTokenData): Promise<RefreshToken>;
  abstract findByHash(tokenHash: string): Promise<RefreshToken | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<number>;
  /** Revokes every session of a user except the one presenting the request. */
  abstract revokeAllForUserExcept(userId: string, keepId: string): Promise<number>;
  /**
   * Housekeeping: drops rows whose `expiresAt` is already in the past.
   *
   * Revoked-but-unexpired rows are deliberately kept: they are what lets
   * `RefreshTokenUseCase` tell a replayed token from an unknown one.
   */
  abstract deleteExpired(before: Date): Promise<number>;
}
