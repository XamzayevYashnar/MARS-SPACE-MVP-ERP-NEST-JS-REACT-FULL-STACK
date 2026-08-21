import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Roles } from '../../../common/decorators/auth.decorators';
import { IdParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import {
  CreateTestimonialDto,
  PublishTestimonialDto,
  QueryTestimonialsDto,
  TestimonialResponseDto,
  UpdateTestimonialDto,
} from '../application/dto/testimonial.dto';
import { CreateTestimonialUseCase } from '../application/use-cases/create-testimonial.use-case';
import { DeleteTestimonialUseCase } from '../application/use-cases/delete-testimonial.use-case';
import { GetTestimonialUseCase } from '../application/use-cases/get-testimonial.use-case';
import { ListTestimonialsUseCase } from '../application/use-cases/list-testimonials.use-case';
import { PublishTestimonialUseCase } from '../application/use-cases/publish-testimonial.use-case';
import { UpdateTestimonialUseCase } from '../application/use-cases/update-testimonial.use-case';

@ApiTags('Admin: Testimonials')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/testimonials')
export class TestimonialsAdminController {
  constructor(
    private readonly listTestimonials: ListTestimonialsUseCase,
    private readonly getTestimonial: GetTestimonialUseCase,
    private readonly createTestimonial: CreateTestimonialUseCase,
    private readonly updateTestimonial: UpdateTestimonialUseCase,
    private readonly publishTestimonial: PublishTestimonialUseCase,
    private readonly deleteTestimonial: DeleteTestimonialUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every review' })
  @ApiOkPaginated(TestimonialResponseDto)
  list(@Query() query: QueryTestimonialsDto): Promise<Paginated<TestimonialResponseDto>> {
    return this.listTestimonials.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiOkEnvelope(TestimonialResponseDto)
  create(@Body() dto: CreateTestimonialDto): Promise<TestimonialResponseDto> {
    return this.createTestimonial.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one review' })
  @ApiOkEnvelope(TestimonialResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<TestimonialResponseDto> {
    return this.getTestimonial.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiOkEnvelope(TestimonialResponseDto)
  update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateTestimonialDto,
  ): Promise<TestimonialResponseDto> {
    return this.updateTestimonial.execute(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a review' })
  @ApiOkEnvelope(TestimonialResponseDto)
  publish(
    @Param() { id }: IdParamDto,
    @Body() dto: PublishTestimonialDto,
  ): Promise<TestimonialResponseDto> {
    return this.publishTestimonial.execute(id, dto.isPublished);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteTestimonial.execute(id);
  }
}
