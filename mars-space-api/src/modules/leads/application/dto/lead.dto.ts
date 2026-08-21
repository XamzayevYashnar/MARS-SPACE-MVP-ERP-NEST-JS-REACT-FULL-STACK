import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { HONEYPOT_FIELD } from '../../../../common/constants/app.constants';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';

/** Public lead-capture body (§6.3). */
export class CreateLeadDto {
  @ApiProperty({ example: 'Ulug‘bek Ismatullayev' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '+998901234567', description: 'Normalised to +998XXXXXXXXX' })
  @IsString()
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ description: 'Course the visitor was looking at' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 'Kurs narxi qiziqtiryapti' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.WEBSITE_FORM })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ example: 'instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @ApiPropertyOptional({ example: 'cpc' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @ApiPropertyOptional({ example: 'autumn-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmCampaign?: string;

  @ApiPropertyOptional({ example: 'https://marsspace.uz/courses/frontend-react' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  pageUrl?: string;

  @ApiPropertyOptional({
    description: `Honeypot: render it hidden and leave it empty. A filled "${HONEYPOT_FIELD}" is treated as a bot and silently accepted.`,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}

export class AssignLeadDto {
  @ApiPropertyOptional({ description: 'Staff account to own this lead; null unassigns' })
  @IsOptional()
  @IsString()
  assignedToId?: string | null;
}

export class UpdateLeadNoteDto {
  @ApiProperty({ example: 'Ertaga 15:00 da qayta qo‘ng‘iroq qilish' })
  @IsString()
  @MaxLength(2000)
  adminNote!: string;
}

export class ConvertLeadDto {
  @ApiProperty({ description: 'Group the new student joins' })
  @IsString()
  groupId!: string;

  @ApiPropertyOptional({ example: 'To‘lovni bo‘lib to‘laydi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class QueryLeadsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-08-01', type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31', type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class LeadCourseSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  title!: LocalizedText;
}

export class LeadAssigneeSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({ example: API_EXAMPLES.email }) email!: string;
}

export class LeadResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({ example: '+998901234567' }) phone!: string;
  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) courseId!: string | null;
  @ApiProperty({ type: LeadCourseSummaryDto, nullable: true })
  course!: LeadCourseSummaryDto | null;
  @ApiProperty({ example: 'Kurs narxi va boshlanish sanasi qiziqtiryapti', nullable: true })
  message!: string | null;
  @ApiProperty({ enum: LeadSource }) source!: LeadSource;
  @ApiProperty({ enum: LeadStatus }) status!: LeadStatus;
  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) assignedToId!: string | null;
  @ApiProperty({ type: LeadAssigneeSummaryDto, nullable: true })
  assignedTo!: LeadAssigneeSummaryDto | null;
  @ApiProperty({ example: 'Ertaga 15:00 da qayta qo‘ng‘iroq qilish', nullable: true }) adminNote!:
    string | null;
  @ApiProperty({ example: API_EXAMPLES.utmSource, nullable: true }) utmSource!: string | null;
  @ApiProperty({ example: API_EXAMPLES.utmMedium, nullable: true }) utmMedium!: string | null;
  @ApiProperty({ example: API_EXAMPLES.utmCampaign, nullable: true }) utmCampaign!: string | null;
  @ApiProperty({ example: API_EXAMPLES.pageUrl, nullable: true }) pageUrl!: string | null;
  @ApiProperty({
    example: API_EXAMPLES.timestamp,
    type: String,
    format: 'date-time',
    nullable: true,
  })
  contactedAt!: Date | null;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Public confirmation — deliberately reveals nothing about the stored lead. */
export class LeadAcceptedDto {
  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Arizangiz qabul qilindi. Tez orada bog‘lanamiz.' })
  message!: string;
}

export class LeadConversionResultDto {
  @ApiProperty({ type: LeadResponseDto })
  @Type(() => LeadResponseDto)
  lead!: LeadResponseDto;

  @ApiProperty({ description: 'Id of the student created from this lead' })
  studentId!: string;
}
