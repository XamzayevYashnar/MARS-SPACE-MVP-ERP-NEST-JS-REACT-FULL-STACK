import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { Paginated } from '../../../common/interfaces';
import {
  QueryPublicTestimonialsDto,
  TestimonialResponseDto,
} from '../application/dto/testimonial.dto';
import { ListTestimonialsUseCase } from '../application/use-cases/list-testimonials.use-case';

@ApiTags('Public')
@Public()
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly listTestimonials: ListTestimonialsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Published reviews; optionally scoped to one course' })
  @ApiOkPaginated(TestimonialResponseDto)
  list(@Query() query: QueryPublicTestimonialsDto): Promise<Paginated<TestimonialResponseDto>> {
    return this.listTestimonials.executePublic(query);
  }
}
