import { registerAs } from '@nestjs/config';

export interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  managerEmail: string;
  managerPassword: string;
}

export const seedConfig = registerAs<SeedConfig>('seed', () => ({
  adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@marsspace.uz',
  adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
  managerEmail: process.env.SEED_MANAGER_EMAIL ?? 'manager@marsspace.uz',
  managerPassword: process.env.SEED_MANAGER_PASSWORD ?? 'ChangeMe123!',
}));
