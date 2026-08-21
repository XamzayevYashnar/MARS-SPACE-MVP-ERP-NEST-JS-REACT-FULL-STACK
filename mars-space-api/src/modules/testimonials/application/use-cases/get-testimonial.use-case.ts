import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { TestimonialResponseDto } from '../dto/testimonial.dto';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class GetTestimonialUseCase {
  constructor(private readonly testimonialRepository: TestimonialRepository) {}

  async execute(id: string): Promise<TestimonialResponseDto> {
    const testimonial = await this.testimonialRepository.findById(id);
    if (!testimonial) {
      throw new EntityNotFoundException('Testimonial', id);
    }

    return TestimonialMapper.toResponse(testimonial);
  }
}
