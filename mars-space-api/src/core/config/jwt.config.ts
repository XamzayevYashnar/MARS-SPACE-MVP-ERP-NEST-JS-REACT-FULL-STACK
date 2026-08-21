import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessSecret: string;
  accessExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
