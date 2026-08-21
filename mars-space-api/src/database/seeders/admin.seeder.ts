import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export interface SeededAccounts {
  superAdminId: string;
  managerId: string;
}

/**
 * Creates the two staff accounts the system needs to be usable.
 *
 * Idempotent by email: re-running leaves an existing account untouched rather
 * than resetting a password an operator has already changed (§9, §13).
 */
export async function seedAdmins(prisma: PrismaClient): Promise<SeededAccounts> {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@marsspace.uz').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const managerEmail = (process.env.SEED_MANAGER_EMAIL ?? 'manager@marsspace.uz').toLowerCase();
  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? 'ChangeMe123!';

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: 'Mars Space Super Admin',
      email: adminEmail,
      phone: '+998901234567',
      passwordHash: await argon2.hash(adminPassword, ARGON2_OPTIONS),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      fullName: 'Dilnoza Karimova',
      email: managerEmail,
      phone: '+998901234568',
      passwordHash: await argon2.hash(managerPassword, ARGON2_OPTIONS),
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  return { superAdminId: superAdmin.id, managerId: manager.id };
}
