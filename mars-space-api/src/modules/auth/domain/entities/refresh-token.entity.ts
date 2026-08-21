/**
 * A persisted refresh session.
 *
 * Only the SHA-256 digest of the token is stored, so a database dump cannot be
 * replayed as a live session (§7).
 */
export class RefreshToken {
  constructor(
    readonly id: string,
    readonly tokenHash: string,
    readonly userId: string,
    readonly userAgent: string | null,
    readonly ipAddress: string | null,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isUsable(now: Date = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }
}

export interface CreateRefreshTokenData {
  tokenHash: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}
