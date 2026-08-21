import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CourseFormat, CourseLevel, GroupStatus, WeekDay } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
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
import {
  CourseSyllabusModuleDto,
  LocalizedStringListDto,
  LocalizedTextDto,
  ShortLocalizedTextDto,
} from '../../../../common/dto/localized-text.dto';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import {
  CourseSyllabusModule,
  LocalizedStringList,
  LocalizedText,
} from '../../../../common/interfaces';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class CreateCourseDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiProperty({ type: ShortLocalizedTextDto, description: 'Max 240 characters per locale' })
  @ValidateNested()
  @Type(() => ShortLocalizedTextDto)
  shortDescription!: ShortLocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto, description: 'Rich text; sanitised server-side' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedStringListDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringListDto)
  outcomes?: LocalizedStringListDto;

  @ApiPropertyOptional({ type: LocalizedStringListDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringListDto)
  requirements?: LocalizedStringListDto;

  @ApiPropertyOptional({ type: [CourseSyllabusModuleDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => CourseSyllabusModuleDto)
  syllabus?: CourseSyllabusModuleDto[];

  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({
    example: 'frontend-react',
    description: 'Derived from title.uz when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase latin with single hyphens' })
  slug?: string;

  @ApiProperty({ enum: CourseLevel, default: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @ApiProperty({ enum: CourseFormat, default: CourseFormat.OFFLINE })
  @IsEnum(CourseFormat)
  format!: CourseFormat;

  @ApiProperty({ example: 6, minimum: 1, maximum: 36 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  durationMonths!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  lessonsPerWeek!: number;

  @ApiPropertyOptional({ example: 90, minimum: 30, maximum: 300, default: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(300)
  lessonMinutes?: number;

  @ApiProperty({ example: 1800000, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 1500000, description: 'Must be lower than price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ example: 'UZS', default: 'UZS' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ example: API_EXAMPLES.imageUrl })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: API_EXAMPLES.videoUrl })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  promoVideoUrl?: string;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  metaTitle?: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  metaDescription?: LocalizedTextDto;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  teacherIds?: string[];
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class PublishCourseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}

export class FeatureCourseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isFeatured!: boolean;
}

export class QueryPublicCoursesDto extends PublicPaginationQueryDto {
  @ApiPropertyOptional({ example: 'frontend' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  categorySlug?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ enum: CourseFormat })
  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 3000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

export class QueryCoursesDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ enum: CourseFormat })
  @IsOptional()
  @IsEnum(CourseFormat)
  format?: CourseFormat;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherId?: string;
}

// ── Response shapes ──────────────────────────────────────────

export class CoursePriceDto {
  @ApiProperty({ example: 1800000 })
  amount!: number;

  @ApiProperty({ example: 1500000, nullable: true })
  discountAmount!: number | null;

  @ApiProperty({ example: 1500000, description: 'What the student actually pays' })
  effectiveAmount!: number;

  @ApiProperty({ example: 17, nullable: true })
  discountPercent!: number | null;

  @ApiProperty({ example: 'UZS' })
  currency!: string;
}

export class CourseCategorySummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend', ru: 'Frontend', en: 'Frontend' },
  })
  name!: LocalizedText | string;
  @ApiProperty({ example: API_EXAMPLES.colorHex, nullable: true }) colorHex!: string | null;
  @ApiProperty({ example: API_EXAMPLES.iconKey, nullable: true }) iconKey!: string | null;
}

export class CourseTeacherSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Senior dasturchi', ru: 'Senior разработчик', en: 'Senior developer' },
  })
  position!: LocalizedText | string;
  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true }) photoUrl!: string | null;
}

export class CourseGroupSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'FS-2026-02' }) name!: string;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  startDate!: Date;
  @ApiProperty({ enum: WeekDay, isArray: true }) weekDays!: WeekDay[];
  @ApiProperty({ example: '18:00' }) startTime!: string;
  @ApiProperty({ example: '19:30' }) endTime!: string;
  @ApiProperty({ enum: GroupStatus }) status!: GroupStatus;
  @ApiProperty({ example: 15 }) capacity!: number;
  @ApiProperty({ example: 4 }) freeSeats!: number;
}

export class CourseTestimonialSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) authorName!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturchi', ru: 'Frontend разработчик', en: 'Frontend developer' },
    nullable: true,
  })
  authorRole!: LocalizedText | string | null;
  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ example: 5 }) rating!: number;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Ajoyib kurs edi', ru: 'Отличный курс', en: 'A great course' },
  })
  content!: LocalizedText | string;
}

export class CourseResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'frontend-react' }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  title!: LocalizedText | string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Qisqa tavsif', ru: 'Краткое описание', en: 'Short description' },
  })
  shortDescription!: LocalizedText | string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: '<p>Toʻliq tavsif</p>', ru: '', en: '' },
  })
  description!: LocalizedText | string;

  @ApiProperty({
    nullable: true,
    description: 'Localised list, or a flat array when ?lang= is set',
  })
  outcomes!: LocalizedStringList | string[] | null;

  @ApiProperty({ nullable: true })
  requirements!: LocalizedStringList | string[] | null;

  @ApiProperty({ nullable: true, type: [CourseSyllabusModuleDto] })
  syllabus!: CourseSyllabusModule[] | null;

  @ApiProperty({ example: API_EXAMPLES.cuid }) categoryId!: string;
  @ApiProperty({ type: CourseCategorySummaryDto, nullable: true })
  category!: CourseCategorySummaryDto | null;

  @ApiProperty({ enum: CourseLevel }) level!: CourseLevel;
  @ApiProperty({ enum: CourseFormat }) format!: CourseFormat;
  @ApiProperty({ example: 6 }) durationMonths!: number;
  @ApiProperty({ example: 3 }) lessonsPerWeek!: number;
  @ApiProperty({ example: 90 }) lessonMinutes!: number;
  @ApiProperty({ example: 78, description: 'Derived from duration and weekly cadence' })
  totalLessons!: number;

  @ApiProperty({ type: CoursePriceDto }) price!: CoursePriceDto;

  @ApiProperty({ example: API_EXAMPLES.imageUrl, nullable: true }) coverImageUrl!: string | null;
  @ApiProperty({ example: API_EXAMPLES.videoUrl, nullable: true }) promoVideoUrl!: string | null;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend kurslari', ru: 'Курсы Frontend', en: 'Frontend courses' },
    nullable: true,
  })
  metaTitle!: LocalizedText | string | null;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Toshkentda frontend', ru: 'Frontend в Ташкенте', en: 'Frontend in Tashkent' },
    nullable: true,
  })
  metaDescription!: LocalizedText | string | null;

  @ApiProperty({ example: true }) isFeatured!: boolean;
  @ApiProperty({ example: true }) isPublished!: boolean;
  @ApiProperty({ example: 1 }) sortOrder!: number;

  @ApiProperty({ type: [CourseTeacherSummaryDto] }) teachers!: CourseTeacherSummaryDto[];
  @ApiProperty({ type: [CourseGroupSummaryDto], description: 'Open intakes' })
  groups!: CourseGroupSummaryDto[];
  @ApiProperty({ type: [CourseTestimonialSummaryDto] })
  testimonials!: CourseTestimonialSummaryDto[];

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
