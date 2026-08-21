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
import { LocalizedTextDto, ShortLocalizedTextDto } from '../../../../common/dto/localized-text.dto';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class CreatePostDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiProperty({ type: ShortLocalizedTextDto })
  @ValidateNested()
  @Type(() => ShortLocalizedTextDto)
  excerpt!: ShortLocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto, description: 'Rich text; sanitised server-side' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  content!: LocalizedTextDto;

  @ApiPropertyOptional({ example: 'frontend-yol-xaritasi', description: 'Derived from title.uz' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase latin with single hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: API_EXAMPLES.imageUrl })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['frontend', 'karyera'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(15)
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  readMinutes?: number;

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
  isPublished?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class PublishPostDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}

export class QueryPostsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'karyera' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPublished?: boolean;
}

export class QueryPublicPostsDto extends PublicPaginationQueryDto {
  @ApiPropertyOptional({ example: 'karyera' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;
}

export class PostAuthorSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true }) avatarUrl!: string | null;
}

export class PostResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'frontend-yol-xaritasi' }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  title!: LocalizedText | string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Qisqacha mazmun', ru: 'Кратко', en: 'In short' },
  })
  excerpt!: LocalizedText | string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Ajoyib kurs edi', ru: 'Отличный курс', en: 'A great course' },
  })
  content!: LocalizedText | string;
  @ApiProperty({ example: API_EXAMPLES.imageUrl, nullable: true }) coverImageUrl!: string | null;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) authorId!: string | null;
  @ApiProperty({ type: PostAuthorSummaryDto, nullable: true })
  author!: PostAuthorSummaryDto | null;
  @ApiProperty({ example: 5 }) readMinutes!: number;
  @ApiProperty({ example: 128 }) viewCount!: number;
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
  @ApiProperty({ example: true }) isPublished!: boolean;
  @ApiProperty({
    example: API_EXAMPLES.timestamp,
    type: String,
    format: 'date-time',
    nullable: true,
  })
  publishedAt!: Date | null;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
