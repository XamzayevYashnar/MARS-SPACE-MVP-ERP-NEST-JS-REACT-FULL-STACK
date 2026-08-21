import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsObject } from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';

export class PutSettingDto {
  @ApiProperty({
    description: 'Arbitrary JSON object stored under this key',
    example: { phones: ['+998 71 200 30 40'], email: 'info@marsspace.uz' },
    type: 'object',
    additionalProperties: true,
  })
  @IsDefined()
  @IsObject({ message: 'value must be a JSON object' })
  value!: Record<string, unknown>;
}

export class SettingResponseDto {
  @ApiProperty({ example: 'contacts' })
  key!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  value!: unknown;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}

/**
 * `GET /settings` returns the whole public bundle keyed by setting name.
 *
 * The payload is an open map rather than a fixed class: the marketing site
 * adds settings keys far more often than the API should need a release, so the
 * shape is documented here and validated only on write.
 */
export class SettingsBundleDto {
  @ApiProperty({ description: 'Contact details, phones, address, working hours' })
  contacts!: Record<string, unknown>;

  @ApiProperty({ description: 'Social network links' })
  socials!: Record<string, unknown>;

  @ApiProperty({ description: 'Counters shown in the home-page hero', type: [Object] })
  hero_stats!: unknown[];

  @ApiProperty({ description: 'Default SEO title, description and OG image' })
  seo_defaults!: Record<string, unknown>;
}
