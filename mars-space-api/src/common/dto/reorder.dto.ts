import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderItemDto {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

/** Body of the `PATCH /reorder` routes shared by categories and teachers. */
export class ReorderDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
