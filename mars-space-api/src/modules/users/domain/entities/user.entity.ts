import { UserRole } from '@prisma/client';

/**
 * Staff account.
 *
 * `passwordHash` lives on the entity because the auth use cases verify against
 * it, but it must never cross the presentation boundary — `UserMapper` is the
 * only path from here to an HTTP response (§0 rule 6).
 */
export class User {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
    readonly phone: string | null,
    readonly passwordHash: string,
    readonly role: UserRole,
    readonly avatarUrl: string | null,
    readonly isActive: boolean,
    readonly lastLoginAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /** A deactivated account keeps its data but can no longer authenticate. */
  canAuthenticate(): boolean {
    return this.isActive;
  }
}

export interface CreateUserData {
  fullName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string | null;
  passwordHash?: string;
  role?: UserRole;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface UserQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}
