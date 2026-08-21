import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { HONEYPOT_FIELD } from '../../../../common/constants/app.constants';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Hasan Aliyev' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: 'hasan@gmail.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: 'Hamkorlik taklifi' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'Korporativ kurs tashkil qilish mumkinmi?' })
  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message!: string;

  @ApiPropertyOptional({
    description: `Honeypot: render it hidden and leave it empty. A filled "${HONEYPOT_FIELD}" is treated as a bot.`,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class QueryContactMessagesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isRead?: boolean;
}

export class MarkMessageReadDto {
  @ApiPropertyOptional({ example: false, default: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class ContactMessageResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({ example: API_EXAMPLES.email, nullable: true }) email!: string | null;
  @ApiProperty({ example: '+998901234567' }) phone!: string;
  @ApiProperty({ example: 'Hamkorlik taklifi', nullable: true }) subject!: string | null;
  @ApiProperty({ example: 'Kurs narxi va boshlanish sanasi qiziqtiryapti' }) message!: string;
  @ApiProperty({ example: false }) isRead!: boolean;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Public acknowledgement — mirrors the lead endpoint. */
export class ContactAcceptedDto {
  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Murojaatingiz qabul qilindi.' })
  message!: string;
}
