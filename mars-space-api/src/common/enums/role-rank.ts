import { UserRole } from '@prisma/client';

/**
 * Privilege ordering behind the "minimum role" column of §6.3.
 * Higher rank means strictly more permissions.
 */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.MANAGER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/** True when `role` satisfies a route documented as requiring `minimum`. */
export function hasAtLeastRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
