import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { LocalizedTextDto } from '../../../../common/dto/localized-text.dto';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Zarina Mahmudova' })
  @IsString()
  @MaxLength(120)
  authorName!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  content!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto, example: { uz: 'Frontend developer, Uzum' } })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  authorRole?: LocalizedTextDto;

  @ApiPropertyOptional({ example: API_EXAMPLES.avatarUrl })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Course this review is about' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  videoUrl?: string;

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
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

export class PublishTestimonialDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}

export class QueryTestimonialsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}

export class QueryPublicTestimonialsDto extends PublicPaginationQueryDto {
  @ApiPropertyOptional({ example: 'frontend-react' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  courseSlug?: string;
}

export class TestimonialCourseSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  title!: LocalizedText | string;
}

export class TestimonialResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) authorName!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturchi', ru: 'Frontend разработчик', en: 'Frontend developer' },
    nullable: true,
  })
  authorRole!: LocalizedText | string | null;
  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) courseId!: string | null;
  @ApiProperty({ type: TestimonialCourseSummaryDto, nullable: true })
  course!: TestimonialCourseSummaryDto | null;
  @ApiProperty({ example: 5 }) rating!: number;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Ajoyib kurs edi', ru: 'Отличный курс', en: 'A great course' },
  })
  content!: LocalizedText | string;
  @ApiProperty({ example: API_EXAMPLES.videoUrl, nullable: true }) videoUrl!: string | null;
  @ApiProperty({ example: true }) isPublished!: boolean;
  @ApiProperty({ example: 1 }) sortOrder!: number;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
