import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { GroupStatus, WeekDay } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { API_EXAMPLES } from '../../../../common/constants/api-examples';
import { TIME_HH_MM_REGEX } from '../../../../common/constants/regex';
import {
  PaginationQueryDto,
  PublicPaginationQueryDto,
} from '../../../../common/dto/pagination-query.dto';
import { LocalizedText } from '../../../../common/interfaces';

export class CreateGroupDto {
  @ApiProperty({ example: 'FS-2026-03', description: 'Unique intake code' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9i0j1' })
  @IsString()
  courseId!: string;

  @ApiPropertyOptional({ example: 'clx1a2b3c4d5e6f7g8h9i0j2' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({ example: '2026-09-01', type: String, format: 'date' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-03-01', type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: WeekDay, isArray: true, example: [WeekDay.MON, WeekDay.WED, WeekDay.FRI] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsEnum(WeekDay, { each: true })
  weekDays!: WeekDay[];

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(TIME_HH_MM_REGEX, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '19:30' })
  @IsString()
  @Matches(TIME_HH_MM_REGEX, { message: 'endTime must be HH:mm' })
  endTime!: string;

  @ApiPropertyOptional({ example: 'Mars-1' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  roomName?: string;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 200, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  capacity?: number;

  @ApiPropertyOptional({ enum: GroupStatus, default: GroupStatus.FORMING })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

export class UpdateGroupStatusDto {
  @ApiProperty({ enum: GroupStatus })
  @IsEnum(GroupStatus)
  status!: GroupStatus;
}

export class QueryGroupsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}

/** `GET /groups/upcoming` takes only the shared public parameters. */
export class QueryUpcomingGroupsDto extends PublicPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Restrict to one course' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value : undefined))
  courseId?: string;
}

export class GroupCourseSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({
    description: 'LocalizedText object, or a plain string for that locale when ?lang= is supplied',
    example: { uz: 'Frontend dasturlash', ru: 'Frontend разработка', en: 'Frontend development' },
  })
  title!: LocalizedText | string;
}

export class GroupTeacherSummaryDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: API_EXAMPLES.courseSlug }) slug!: string;
  @ApiProperty({ example: API_EXAMPLES.fullName }) fullName!: string;
  @ApiProperty({ example: API_EXAMPLES.avatarUrl, nullable: true }) photoUrl!: string | null;
}

export class GroupResponseDto {
  @ApiProperty({ example: API_EXAMPLES.cuid }) id!: string;
  @ApiProperty({ example: 'FS-2026-03' }) name!: string;
  @ApiProperty({ example: API_EXAMPLES.cuid }) courseId!: string;
  @ApiProperty({ type: GroupCourseSummaryDto, nullable: true })
  course!: GroupCourseSummaryDto | null;

  @ApiProperty({ example: API_EXAMPLES.cuid, nullable: true }) teacherId!: string | null;
  @ApiProperty({ type: GroupTeacherSummaryDto, nullable: true })
  teacher!: GroupTeacherSummaryDto | null;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  startDate!: Date;
  @ApiProperty({
    example: API_EXAMPLES.timestamp,
    type: String,
    format: 'date-time',
    nullable: true,
  })
  endDate!: Date | null;
  @ApiProperty({ enum: WeekDay, isArray: true }) weekDays!: WeekDay[];
  @ApiProperty({ example: '18:00' }) startTime!: string;
  @ApiProperty({ example: '19:30' }) endTime!: string;
  @ApiProperty({ example: API_EXAMPLES.roomName, nullable: true }) roomName!: string | null;

  @ApiProperty({ example: 15 }) capacity!: number;
  @ApiProperty({ example: 11 }) activeStudentsCount!: number;
  @ApiProperty({ example: 4 }) freeSeats!: number;
  @ApiProperty({ enum: GroupStatus }) status!: GroupStatus;

  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ example: API_EXAMPLES.timestamp, type: String, format: 'date-time' })
  updatedAt!: Date;
}
