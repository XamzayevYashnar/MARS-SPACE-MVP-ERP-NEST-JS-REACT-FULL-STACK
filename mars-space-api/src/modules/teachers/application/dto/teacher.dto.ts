import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { SLUG_REGEX } from '../../../../common/constants/regex';
import { LocalizedTextDto } from '../../../../common/dto/localized-text.dto';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class TeacherSocialsDto {
  @ApiPropertyOptional({ example: 'https://t.me/jasur_dev' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(300)
  telegram?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/jasur' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(300)
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/jasur' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(300)
  github?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/jasur' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(300)
  instagram?: string;
}

export class CreateTeacherDto {
  @ApiProperty({ example: 'Jasur Yuldashev' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  position!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  bio?: LocalizedTextDto;

  @ApiPropertyOptional({
    example: 'jasur-yuldashev',
    description: 'Derived from fullName when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase latin with single hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://cdn.marsspace.uz/uploads/2026/08/teacher.webp' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ example: 7, minimum: 0, maximum: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @ApiPropertyOptional({ type: [String], example: ['React', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @MaxLength(60, { each: true })
  skills?: string[];

  @ApiPropertyOptional({
    example: { telegram: 'https://t.me/jasur_dev', github: 'https://github.com/jasur' },
    type: TeacherSocialsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TeacherSocialsDto)
  socials?: TeacherSocialsDto;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Courses this teacher leads' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  courseIds?: string[];
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {}

export class QueryTeachersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Only teachers assigned to this course' })
  @IsOptional()
  @IsString()
  courseId?: string;
}

export class QueryPublicTeachersDto extends PublicPaginationQueryDto {}

export class TeacherCourseSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid })
  id!: string;

  @ApiProperty({ example: 'frontend-react' })
  slug!: string;

  @ApiProperty()
  title!: LocalizedText | string;

  @ApiProperty({ example: API_EXAMPLES.imageUrl, nullable: true })
  coverImageUrl!: string | null;
}

export class TeacherResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid })
  id!: string;

  @ApiProperty({ example: 'jasur-yuldashev' })
  slug!: string;

  @ApiProperty({ example: 'Jasur Yuldashev' })
  fullName!: string;

  @ApiProperty()
  position!: LocalizedText | string;

  @ApiProperty({ nullable: true })
  bio!: LocalizedText | string | null;

  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true })
  photoUrl!: string | null;

  @ApiProperty({ example: 7 })
  experienceYears!: number;

  @ApiProperty({ type: [String] })
  skills!: string[];

  @ApiProperty({
    example: { telegram: 'https://t.me/jasur_dev', github: 'https://github.com/jasur' },
    type: TeacherSocialsDto,
    nullable: true,
  })
  socials!: TeacherSocialsDto | null;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    type: [TeacherCourseSummaryDto],
    description: 'Published courses of this teacher',
  })
  courses!: TeacherCourseSummaryDto[];

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
