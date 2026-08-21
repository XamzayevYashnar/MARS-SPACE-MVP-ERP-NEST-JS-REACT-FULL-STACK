import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { CreateTestimonialUseCase } from './application/use-cases/create-testimonial.use-case';
import { DeleteTestimonialUseCase } from './application/use-cases/delete-testimonial.use-case';
import { GetTestimonialUseCase } from './application/use-cases/get-testimonial.use-case';
import { ListTestimonialsUseCase } from './application/use-cases/list-testimonials.use-case';
import { PublishTestimonialUseCase } from './application/use-cases/publish-testimonial.use-case';
import { UpdateTestimonialUseCase } from './application/use-cases/update-testimonial.use-case';
import { TestimonialRepository } from './domain/repositories/testimonial.repository';
import { PrismaTestimonialRepository } from './infrastructure/persistence/prisma-testimonial.repository';
import { TestimonialsAdminController } from './presentation/testimonials.admin.controller';
import { TestimonialsController } from './presentation/testimonials.controller';

@Module({
  imports: [CoursesModule],
  controllers: [TestimonialsController, TestimonialsAdminController],
  providers: [
    { provide: TestimonialRepository, useClass: PrismaTestimonialRepository },
    ListTestimonialsUseCase,
    GetTestimonialUseCase,
    CreateTestimonialUseCase,
    UpdateTestimonialUseCase,
    PublishTestimonialUseCase,
    DeleteTestimonialUseCase,
  ],
  exports: [TestimonialRepository],
})
export class TestimonialsModule {}
