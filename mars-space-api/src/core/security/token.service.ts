import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { JwtConfig } from '../config/jwt.config';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  /** Absolute expiry of the refresh token, persisted alongside its hash. */
  refreshExpiresAt: Date;
  /** Access-token lifetime in seconds, handed to the client for scheduling. */
  expiresIn: number;
}

/**
 * Issues and verifies the JWT pair of §7.
 *
 * The refresh token is deliberately an opaque random string rather than a JWT:
 * it is only ever presented back to this API, and storing just its SHA-256
 * digest means a database leak does not hand out live sessions.
 */
@Injectable()
export class TokenService {
  private readonly config: JwtConfig;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<JwtConfig>('jwt');
  }

  async issueAccessToken(claims: AccessTokenClaims): Promise<string> {
    return this.jwtService.signAsync(claims, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessExpiresIn,
    });
  }

  /** Generates a refresh token together with the digest to persist. */
  createRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');

    return {
      token,
      tokenHash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + this.refreshTtlMs()),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Access-token lifetime in seconds, for the `expiresIn` field of the response. */
  accessTtlSeconds(): number {
    return Math.floor(parseDuration(this.config.accessExpiresIn) / 1000);
  }

  refreshTtlMs(): number {
    return parseDuration(this.config.refreshExpiresIn);
  }
}

const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Parses the `15m` / `7d` duration format used by the JWT config.
 * Exported for the unit tests; invalid input falls back to 15 minutes rather
 * than producing a token that never expires.
 */
export function parseDuration(input: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) {
    return 15 * 60 * 1000;
  }

  const [, amount, unit] = match;
  return Number(amount) * (UNIT_MS[unit] ?? 60_000);
}
