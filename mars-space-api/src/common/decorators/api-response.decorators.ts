import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';

/** Documented shape of the `meta` block (§6.1). */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 12 })
  limit!: number;

  @ApiProperty({ example: 48 })
  total!: number;

  @ApiProperty({ example: 4 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

/**
 * Documents a single-object success envelope.
 *
 * The interceptor builds the envelope at runtime, so without these decorators
 * Swagger would advertise the bare DTO and mislead every client generator.
 */
export function ApiOkEnvelope<TModel extends Type<unknown>>(model: TModel, description?: string) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          data: { $ref: getSchemaPath(model) },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
}

/** Documents a paginated success envelope: `data` is the array, `meta` the page info. */
export function ApiOkPaginated<TModel extends Type<unknown>>(model: TModel, description?: string) {
  return applyDecorators(
    ApiExtraModels(model, PaginationMetaDto),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
}
