import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';

@Injectable()
export class DeleteTestimonialUseCase {
  constructor(private readonly testimonialRepository: TestimonialRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.testimonialRepository.findById(id))) {
      throw new EntityNotFoundException('Testimonial', id);
    }

    await this.testimonialRepository.delete(id);
  }
}
