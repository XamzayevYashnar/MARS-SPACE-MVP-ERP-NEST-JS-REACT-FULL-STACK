import { Paginated } from '../../../../common/interfaces';
import { CreateUserData, UpdateUserData, User, UserQuery } from '../entities/user.entity';

/**
 * Port for user persistence.
 *
 * Abstract class rather than an interface so it survives compilation and can
 * serve as the DI token (§3).
 */
export abstract class UserRepository {
  abstract findMany(query: UserQuery): Promise<Paginated<User>>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
  abstract delete(id: string): Promise<void>;
  abstract touchLastLogin(id: string, at: Date): Promise<void>;
  abstract countByRole(role: string): Promise<number>;
}
