import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * The write-side shape of every localised content field (§5.1).
 *
 * `uz` is mandatory because it is the fallback source; `ru` and `en` may be
 * omitted or left empty and are then resolved to `uz` at read time.
 */
export class LocalizedTextDto {
  @ApiProperty({ example: 'Full Stack dasturlash', description: 'Uzbek text (required)' })
  @IsString()
  @IsNotEmpty({ message: 'uz translation is required' })
  @MaxLength(5000)
  uz!: string;

  @ApiPropertyOptional({ example: 'Full Stack разработка', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ru?: string;

  @ApiPropertyOptional({ example: 'Full Stack development', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  en?: string;
}

/** Same as `LocalizedTextDto` but capped at the 240-char summary limit (§5.2). */
export class ShortLocalizedTextDto {
  @ApiProperty({ example: 'Noldan to‘liq web dasturchi bo‘ling', maxLength: 240 })
  @IsString()
  @IsNotEmpty({ message: 'uz translation is required' })
  @MaxLength(240)
  uz!: string;

  @ApiPropertyOptional({ example: 'Станьте веб-разработчиком с нуля', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  ru?: string;

  @ApiPropertyOptional({ example: 'Become a web developer from scratch', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  en?: string;
}

/** `{ uz: string[], ru: string[], en: string[] }` — outcomes, requirements, topics. */
export class LocalizedStringListDto {
  @ApiProperty({ type: [String], example: ['HTML/CSS asoslari', 'JavaScript ES6+'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  @MaxLength(500, { each: true })
  uz!: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  @MaxLength(500, { each: true })
  ru?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  @MaxLength(500, { each: true })
  en?: string[];
}

/** One syllabus entry — the nested DTO that validates the JSON of §5.3. */
export class CourseSyllabusModuleDto {
  @ApiProperty({ example: 1, description: 'Position of the module inside the syllabus' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(104)
  durationWeeks!: number;

  @ApiProperty({ type: LocalizedStringListDto })
  @ValidateNested()
  @Type(() => LocalizedStringListDto)
  topics!: LocalizedStringListDto;
}
