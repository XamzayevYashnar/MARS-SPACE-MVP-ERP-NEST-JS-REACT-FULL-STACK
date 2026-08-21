import { Paginated } from '../../../../common/interfaces';
import {
  CreateTestimonialData,
  Testimonial,
  TestimonialQuery,
  UpdateTestimonialData,
} from '../entities/testimonial.entity';

export abstract class TestimonialRepository {
  abstract findMany(query: TestimonialQuery): Promise<Paginated<Testimonial>>;
  abstract findById(id: string): Promise<Testimonial | null>;
  abstract create(data: CreateTestimonialData): Promise<Testimonial>;
  abstract update(id: string, data: UpdateTestimonialData): Promise<Testimonial>;
  abstract delete(id: string): Promise<void>;
}
