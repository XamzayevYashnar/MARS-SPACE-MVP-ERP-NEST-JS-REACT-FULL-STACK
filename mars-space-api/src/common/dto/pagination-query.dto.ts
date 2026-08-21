import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/app.constants';
import { Language } from '../enums/language.enum';
import { SortOrder } from '../enums/sort-order.enum';

/** Query parameters accepted by every list endpoint (§6.2). */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: DEFAULT_PAGE, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT, example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Free-text search term', example: 'javascript' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  search?: string;

  @ApiPropertyOptional({ description: 'Column to sort by; unknown values fall back to createdAt' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * Public list endpoints add `lang`: when present the API flattens every
 * `LocalizedText` to a plain string for that locale. Admin endpoints extend
 * `PaginationQueryDto` instead and always return the full object.
 */
export class PublicPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: Language,
    description: 'Flatten localised fields to this language (falls back to uz)',
  })
  @IsOptional()
  @IsEnum(Language)
  lang?: Language;
}
