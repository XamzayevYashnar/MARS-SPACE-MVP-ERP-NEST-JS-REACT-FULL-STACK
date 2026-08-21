import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user.dto';

/**
 * The only bridge from the `User` entity to an HTTP payload.
 *
 * Building the DTO field by field — rather than spreading and deleting — means
 * a future column cannot leak by default; it has to be added here on purpose.
 */
export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users: User[]): UserResponseDto[] {
    return users.map((user) => UserMapper.toResponse(user));
  }
}
