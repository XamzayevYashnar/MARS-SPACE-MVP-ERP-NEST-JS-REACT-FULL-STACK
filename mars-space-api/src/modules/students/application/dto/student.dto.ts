import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StudentStatus } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';

export class CreateStudentDto {
  @ApiProperty({ example: 'Abror Qodirov' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Accepts spaces and dashes; normalised to +998XXXXXXXXX',
  })
  @IsString()
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: 'abror@gmail.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '2004-05-12', type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Target group; capacity is enforced on assignment' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ example: 'To‘lovni bo‘lib to‘laydi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class MoveStudentDto {
  @ApiProperty({ description: 'Group to move the student into' })
  @IsString()
  groupId!: string;
}

export class QueryStudentsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({ description: 'All students across every group of this course' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}

export class StudentGroupSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'FS-2026-01' }) name!: string;
  @ApiProperty({ example: API_EXAMPLES.cuid }) courseId!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  courseTitle!: LocalizedText;
}

export class StudentResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'Abror Qodirov' }) fullName!: string;
  @ApiProperty({ example: '+998901234567' }) phone!: string;
  @ApiProperty({ example: API_EXAMPLES.email, nullable: true }) email!: string | null;
  @ApiProperty({
    example: API_EXAMPLES.timestamp,
    type: String,
    format: 'date-time',
    nullable: true,
  })
  birthDate!: Date | null;
  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) groupId!: string | null;
  @ApiProperty({ type: StudentGroupSummaryDto, nullable: true })
  group!: StudentGroupSummaryDto | null;
  @ApiProperty({ enum: StudentStatus }) status!: StudentStatus;
  @ApiProperty({ example: 'To‘lovni bo‘lib to‘laydi', nullable: true }) note!: string | null;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  enrolledAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
