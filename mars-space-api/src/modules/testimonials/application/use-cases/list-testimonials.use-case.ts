import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import {
  QueryPublicTestimonialsDto,
  QueryTestimonialsDto,
  TestimonialResponseDto,
} from '../dto/testimonial.dto';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class ListTestimonialsUseCase {
  constructor(private readonly testimonialRepository: TestimonialRepository) {}

  async execute(dto: QueryTestimonialsDto): Promise<Paginated<TestimonialResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.testimonialRepository.findMany({
      ...params,
      courseId: dto.courseId,
      isPublished: dto.isPublished,
      minRating: dto.minRating,
    });

    return { items: TestimonialMapper.toResponseList(items), meta };
  }

  /** Public listing: published reviews only, in curated order. */
  async executePublic(dto: QueryPublicTestimonialsDto): Promise<Paginated<TestimonialResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: 'sortOrder', sortOrder: 'asc' });

    const { items, meta } = await this.testimonialRepository.findMany({
      ...params,
      courseSlug: dto.courseSlug,
      isPublished: true,
    });

    return { items: TestimonialMapper.toResponseList(items, dto.lang), meta };
  }
}
