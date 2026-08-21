import { Language } from '../../../../common/enums/language.enum';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { Testimonial } from '../../domain/entities/testimonial.entity';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { CreateTestimonialUseCase } from './create-testimonial.use-case';
import { DeleteTestimonialUseCase } from './delete-testimonial.use-case';
import { GetTestimonialUseCase } from './get-testimonial.use-case';
import { ListTestimonialsUseCase } from './list-testimonials.use-case';
import { PublishTestimonialUseCase } from './publish-testimonial.use-case';
import { UpdateTestimonialUseCase } from './update-testimonial.use-case';

function buildTestimonial(overrides: Partial<Testimonial> = {}): Testimonial {
  return new Testimonial(
    overrides.id ?? 'review-1',
    overrides.authorName ?? 'Zarina Mahmudova',
    overrides.authorRole ?? { uz: 'Dasturchi', ru: 'Разработчик', en: 'Developer' },
    overrides.avatarUrl ?? null,
    overrides.courseId ?? 'course-1',
    overrides.rating ?? 5,
    overrides.content ?? { uz: 'Ajoyib kurs', ru: 'Отличный курс', en: 'Great course' },
    overrides.videoUrl ?? null,
    overrides.isPublished ?? true,
    overrides.sortOrder ?? 1,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

function buildRepository(): jest.Mocked<TestimonialRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildTestimonial()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildTestimonial()),
    create: jest.fn().mockResolvedValue(buildTestimonial()),
    update: jest.fn().mockResolvedValue(buildTestimonial()),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TestimonialRepository>;
}

const courseRepository = {
  existsById: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<CourseRepository>;

describe('CreateTestimonialUseCase', () => {
  let repository: jest.Mocked<TestimonialRepository>;
  let useCase: CreateTestimonialUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository.existsById.mockResolvedValue(true);
    repository = buildRepository();
    useCase = new CreateTestimonialUseCase(repository, courseRepository);
  });

  it('defaults to five stars and an unpublished review', async () => {
    await useCase.execute({ authorName: 'Zarina', content: { uz: 'Ajoyib' } });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 5, isPublished: false, sortOrder: 0 }),
    );
  });

  it('keeps the quote as plain text', async () => {
    await useCase.execute({
      authorName: 'Zarina',
      content: { uz: '<b>Ajoyib</b><script>x</script>' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ uz: 'Ajoyib' }) }),
    );
  });

  it('404s when the referenced course does not exist', async () => {
    courseRepository.existsById.mockResolvedValue(false);

    await expect(
      useCase.execute({ authorName: 'Zarina', content: { uz: 'Ajoyib' }, courseId: 'ghost' }),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('allows a review that is not tied to a course', async () => {
    await useCase.execute({ authorName: 'Zarina', content: { uz: 'Ajoyib' } });

    expect(courseRepository.existsById).not.toHaveBeenCalled();
  });
});

describe('UpdateTestimonialUseCase', () => {
  let repository: jest.Mocked<TestimonialRepository>;
  let useCase: UpdateTestimonialUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository.existsById.mockResolvedValue(true);
    repository = buildRepository();
    useCase = new UpdateTestimonialUseCase(repository, courseRepository);
  });

  it('404s on an unknown review', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { rating: 4 })).rejects.toThrow(EntityNotFoundException);
  });

  it('404s when moving the review to a course that does not exist', async () => {
    courseRepository.existsById.mockResolvedValue(false);

    await expect(useCase.execute('review-1', { courseId: 'ghost' })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('applies a partial update', async () => {
    await useCase.execute('review-1', { rating: 4 });

    expect(repository.update).toHaveBeenCalledWith(
      'review-1',
      expect.objectContaining({ rating: 4, content: undefined }),
    );
  });
});

describe('PublishTestimonialUseCase', () => {
  it('publishes a review', async () => {
    const repository = buildRepository();

    await new PublishTestimonialUseCase(repository).execute('review-1', true);

    expect(repository.update).toHaveBeenCalledWith('review-1', { isPublished: true });
  });

  it('404s on an unknown review', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new PublishTestimonialUseCase(repository).execute('ghost', true)).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('ListTestimonialsUseCase', () => {
  let repository: jest.Mocked<TestimonialRepository>;
  let useCase: ListTestimonialsUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new ListTestimonialsUseCase(repository);
  });

  it('forces isPublished and curated order on the public listing', async () => {
    await useCase.executePublic({ courseSlug: 'frontend-react' });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: true,
        courseSlug: 'frontend-react',
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      }),
    );
  });

  it('flattens the quote for the requested language', async () => {
    const result = await useCase.executePublic({ lang: Language.RU });

    expect(result.items[0].content).toBe('Отличный курс');
  });

  it('passes the admin filters through', async () => {
    await useCase.execute({ courseId: 'course-1', minRating: 4, isPublished: false });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1', minRating: 4, isPublished: false }),
    );
  });
});

describe('GetTestimonialUseCase and DeleteTestimonialUseCase', () => {
  it('reads a review', async () => {
    const repository = buildRepository();

    await expect(new GetTestimonialUseCase(repository).execute('review-1')).resolves.toMatchObject({
      id: 'review-1',
      rating: 5,
    });
  });

  it('404s on an unknown review', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new GetTestimonialUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('deletes a review', async () => {
    const repository = buildRepository();

    await new DeleteTestimonialUseCase(repository).execute('review-1');

    expect(repository.delete).toHaveBeenCalledWith('review-1');
  });

  it('404s when deleting an unknown review', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new DeleteTestimonialUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});
