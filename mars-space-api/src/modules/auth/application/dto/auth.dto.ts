import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MESSAGE,
  PASSWORD_RULE,
  UserResponseDto,
} from '../../../users/application/dto/user.dto';

export class LoginDto {
  @ApiProperty({ example: 'admin@marsspace.uz' })
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

/**
 * The refresh token arrives either in the httpOnly cookie or in the body, so a
 * browser SPA and a mobile client can both use the same endpoint (§6.3).
 */
export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Omit when the httpOnly refresh cookie is sent instead',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  refreshToken?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ example: 'N3wStrongPass!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'Bearer token for the Authorization header' })
  accessToken!: string;

  @ApiProperty({ description: 'Also set as the httpOnly mars_refresh_token cookie' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access-token lifetime in seconds' })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;
}

export class LoginResponseDto extends AuthTokensDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}
