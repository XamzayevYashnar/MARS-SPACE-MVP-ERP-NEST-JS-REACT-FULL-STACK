import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL ?? '',
}));
