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

/** The placeholders shipped in `.env.example`; never valid outside development. */
const PLACEHOLDER_PASSWORDS = new Set(['ChangeMe123!', 'changeme', 'password', 'admin']);

/**
 * Refuses to mint a production account behind a password that is published in
 * the repository. `docker-compose.yml` defaults `SEED_ADMIN_PASSWORD` to
 * `ChangeMe123!`, so a deployment that forgot to override it would otherwise
 * come up with a publicly known SUPER_ADMIN login.
 */
function assertProductionSecret(variable: string, value: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (PLACEHOLDER_PASSWORDS.has(value)) {
    throw new Error(
      `${variable} is still set to the example placeholder. Set a real password before seeding a production database.`,
    );
  }

  if (value.length < 12) {
    throw new Error(`${variable} must be at least 12 characters in production.`);
  }
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

  assertProductionSecret('SEED_ADMIN_PASSWORD', adminPassword);
  assertProductionSecret('SEED_MANAGER_PASSWORD', managerPassword);

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
