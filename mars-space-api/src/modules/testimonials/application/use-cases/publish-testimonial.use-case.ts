import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { TestimonialResponseDto } from '../dto/testimonial.dto';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class PublishTestimonialUseCase {
  constructor(private readonly testimonialRepository: TestimonialRepository) {}

  async execute(id: string, isPublished: boolean): Promise<TestimonialResponseDto> {
    if (!(await this.testimonialRepository.findById(id))) {
      throw new EntityNotFoundException('Testimonial', id);
    }

    const testimonial = await this.testimonialRepository.update(id, { isPublished });
    return TestimonialMapper.toResponse(testimonial);
  }
}
