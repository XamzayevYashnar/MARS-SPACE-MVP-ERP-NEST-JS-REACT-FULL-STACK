import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { HEX_COLOR_REGEX, SLUG_REGEX } from '../../../../common/constants/regex';
import { LocalizedTextDto } from '../../../../common/dto/localized-text.dto';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';
import { toOptionalBoolean } from '../../../../common/utils/transform.util';

export class CreateCategoryDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @ApiPropertyOptional({
    example: 'frontend',
    description: 'Generated from name.uz when omitted; must stay unique',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase latin with single hyphens' })
  slug?: string;

  @ApiPropertyOptional({
    example: 'layout',
    description: 'Icon identifier resolved on the frontend',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  iconKey?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'colorHex must be a hex colour such as #3B82F6' })
  colorHex?: string;

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
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class QueryCategoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}

/** Public listing: active only, and localised when `lang` is supplied. */
export class QueryPublicCategoriesDto extends PublicPaginationQueryDto {}

export class CategoryResponseDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  id!: string;

  @ApiProperty({ example: 'frontend' })
  slug!: string;

  @ApiProperty({
    description: 'LocalizedText, or a plain string when ?lang= was supplied',
    oneOf: [{ $ref: '#/components/schemas/LocalizedTextDto' }, { type: 'string' }],
  })
  name!: LocalizedText | string;

  @ApiProperty({ nullable: true })
  description!: LocalizedText | string | null;

  @ApiProperty({ nullable: true, example: 'layout' })
  iconKey!: string | null;

  @ApiProperty({ nullable: true, example: '#3B82F6' })
  colorHex!: string | null;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 3, description: 'Published courses in this category' })
  coursesCount!: number;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
