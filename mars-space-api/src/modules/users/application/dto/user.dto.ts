import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { UZ_PHONE_REGEX } from '../../../../common/constants/regex';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

/** Shared password policy: long enough, and mixed enough to resist a wordlist. */
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE =
  'password must be at least 8 characters and contain a lowercase letter, an uppercase letter and a digit';

export class CreateUserDto {
  @ApiProperty({ example: 'Alisher Rahimov' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'alisher@marsspace.uz' })
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Str0ngPass!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  @Matches(UZ_PHONE_REGEX, { message: 'phone must match +998XXXXXXXXX' })
  phone?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.ADMIN })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ example: 'https://cdn.marsspace.uz/uploads/2026/08/avatar.webp' })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a valid URL' })
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Password changes go through `PATCH /auth/change-password`, never through update. */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'Deactivating revokes every active session' })
  @IsBoolean()
  isActive!: boolean;
}

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}

/** Response shape — note the absence of `passwordHash` (§13). */
export class UserResponseDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  id!: string;

  @ApiProperty({ example: 'Alisher Rahimov' })
  fullName!: string;

  @ApiProperty({ example: 'alisher@marsspace.uz' })
  email!: string;

  @ApiProperty({ example: '+998901234567', nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: API_EXAMPLES.timestamp,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastLoginAt!: Date | null;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}

export { PASSWORD_MESSAGE, PASSWORD_RULE };
