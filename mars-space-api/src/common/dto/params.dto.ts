import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { SLUG_REGEX } from '../constants/regex';
import { Language } from '../enums/language.enum';

/** `:id` route parameter — every primary key in the schema is a cuid. */
export class IdParamDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1', description: 'cuid identifier' })
  @IsString()
  @Matches(/^[a-z0-9]{20,36}$/i, { message: 'id must be a valid cuid' })
  id!: string;
}

/** `:slug` route parameter for public content routes. */
export class SlugParamDto {
  @ApiProperty({ example: 'full-stack-dasturlash' })
  @IsString()
  @MaxLength(160)
  @Matches(SLUG_REGEX, { message: 'slug must be lowercase latin with single hyphens' })
  slug!: string;
}

/** `?lang=` on public detail routes that take no other query parameters. */
export class LanguageQueryDto {
  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  lang?: Language;
}

/** `:key` route parameter of the settings module. */
export class SettingKeyParamDto {
  @ApiProperty({ example: 'contacts' })
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'key must be snake_case' })
  key!: string;
}
