import { CourseFormat, CourseLevel } from '@prisma/client';
import { Language } from '../../../../common/enums/language.enum';
import {
  BusinessRuleException,
  DomainException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { Category } from '../../../categories/domain/entities/category.entity';
import { CategoryRepository } from '../../../categories/domain/repositories/category.repository';
import { Course } from '../../domain/entities/course.entity';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CoursePrice } from '../../domain/value-objects/course-price.vo';
import { CreateCourseDto } from '../dto/course.dto';
import { CreateCourseUseCase } from './create-course.use-case';
import { DeleteCourseUseCase } from './delete-course.use-case';
import { FeatureCourseUseCase } from './feature-course.use-case';
import { GetCourseUseCase } from './get-course.use-case';
import { ListCoursesUseCase } from './list-courses.use-case';
import { PublishCourseUseCase } from './publish-course.use-case';
import { UpdateCourseUseCase } from './update-course.use-case';

function buildCourse(overrides: Partial<Course> = {}): Course {
  return new Course(
    overrides.id ?? 'course-1',
    overrides.slug ?? 'frontend-react',
    overrides.title ?? { uz: 'Frontend', ru: 'Фронтенд', en: 'Frontend' },
    overrides.shortDescription ?? { uz: 'Qisqa', ru: 'Кратко', en: 'Short' },
    overrides.description ?? { uz: '<p>Matn</p>', ru: '', en: '' },
    overrides.outcomes ?? null,
    overrides.requirements ?? null,
    overrides.syllabus ?? null,
    overrides.categoryId ?? 'cat-1',
    overrides.level ?? CourseLevel.BEGINNER,
    overrides.format ?? CourseFormat.OFFLINE,
    overrides.durationMonths ?? 6,
    overrides.lessonsPerWeek ?? 3,
    overrides.lessonMinutes ?? 90,
    overrides.price ?? CoursePrice.create(1_800_000, null),
    overrides.coverImageUrl ?? null,
    overrides.promoVideoUrl ?? null,
    overrides.metaTitle ?? null,
    overrides.metaDescription ?? null,
    overrides.isFeatured ?? false,
    overrides.isPublished ?? false,
    overrides.sortOrder ?? 0,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

function buildCourseRepository(): jest.Mocked<CourseRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildCourse()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findFeatured: jest.fn().mockResolvedValue([buildCourse({ isFeatured: true })]),
    findById: jest.fn().mockResolvedValue(buildCourse()),
    findBySlug: jest.fn().mockResolvedValue(buildCourse()),
    existsBySlug: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockImplementation(async (data) => buildCourse({ slug: data.slug })),
    update: jest.fn().mockImplementation(async (_id, data) => buildCourse(data as Partial<Course>)),
    delete: jest.fn().mockResolvedValue(undefined),
    countGroups: jest.fn().mockResolvedValue(0),
    existsById: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<CourseRepository>;
}

function buildCategoryRepository(): jest.Mocked<CategoryRepository> {
  const category = new Category(
    'cat-1',
    'frontend',
    { uz: 'Frontend', ru: '', en: '' },
    null,
    null,
    null,
    1,
    true,
    new Date(),
    new Date(),
  );

  return {
    findById: jest.fn().mockResolvedValue(category),
  } as unknown as jest.Mocked<CategoryRepository>;
}

const baseDto: CreateCourseDto = {
  title: { uz: 'Frontend dasturlash' },
  shortDescription: { uz: 'Qisqa tavsif' },
  description: { uz: '<p>Tavsif</p>' },
  categoryId: 'cat-1',
  level: CourseLevel.BEGINNER,
  format: CourseFormat.OFFLINE,
  durationMonths: 6,
  lessonsPerWeek: 3,
  price: 1_800_000,
};

describe('CreateCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let categoryRepository: jest.Mocked<CategoryRepository>;
  let useCase: CreateCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    categoryRepository = buildCategoryRepository();
    useCase = new CreateCourseUseCase(courseRepository, categoryRepository);
  });

  it('derives a slug from title.uz', async () => {
    const result = await useCase.execute(baseDto);

    expect(result.slug).toBe('frontend-dasturlash');
  });

  it('404s when the category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseDto)).rejects.toThrow(EntityNotFoundException);
    expect(courseRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid discount before it reaches the database', async () => {
    await expect(useCase.execute({ ...baseDto, price: 1000, discountPrice: 2000 })).rejects.toThrow(
      DomainException,
    );
    expect(courseRepository.create).not.toHaveBeenCalled();
  });

  it('sanitises the rich-text description but strips the short one', async () => {
    await useCase.execute({
      ...baseDto,
      description: { uz: '<p>Yaxshi</p><script>alert(1)</script>' },
      shortDescription: { uz: '<b>Qisqa</b>' },
    });

    expect(courseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.objectContaining({ uz: '<p>Yaxshi</p>' }),
        shortDescription: expect.objectContaining({ uz: 'Qisqa' }),
      }),
    );
  });

  it('renumbers the syllabus into a contiguous sequence', async () => {
    await useCase.execute({
      ...baseDto,
      syllabus: [
        { order: 7, title: { uz: 'Ikkinchi' }, durationWeeks: 2, topics: { uz: ['b'] } },
        { order: 3, title: { uz: 'Birinchi' }, durationWeeks: 1, topics: { uz: ['a'] } },
      ],
    });

    const created = courseRepository.create.mock.calls[0][0];
    expect(created.syllabus).toEqual([
      expect.objectContaining({ order: 1, title: expect.objectContaining({ uz: 'Birinchi' }) }),
      expect.objectContaining({ order: 2, title: expect.objectContaining({ uz: 'Ikkinchi' }) }),
    ]);
  });

  it('normalises outcome lists into all three locales', async () => {
    await useCase.execute({ ...baseDto, outcomes: { uz: ['Bir', '<b>Ikki</b>'] } });

    const created = courseRepository.create.mock.calls[0][0];
    expect(created.outcomes).toEqual({ uz: ['Bir', 'Ikki'], ru: [], en: [] });
  });

  it('rejects an explicit slug that is taken', async () => {
    courseRepository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute({ ...baseDto, slug: 'frontend-react' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });

  it('creates an unpublished, unfeatured course by default', async () => {
    await useCase.execute(baseDto);

    expect(courseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: false, isFeatured: false, lessonMinutes: 90 }),
    );
  });
});

describe('UpdateCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let categoryRepository: jest.Mocked<CategoryRepository>;
  let useCase: UpdateCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    categoryRepository = buildCategoryRepository();
    useCase = new UpdateCourseUseCase(courseRepository, categoryRepository);
  });

  it('404s on an unknown course', async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { durationMonths: 9 })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('validates the resulting price pair, not just the field that changed', async () => {
    courseRepository.findById.mockResolvedValue(
      buildCourse({ price: CoursePrice.create(1000, null) }),
    );

    // The existing price is 1000, so a 2000 discount is invalid even though
    // `price` itself was not part of the request.
    await expect(useCase.execute('course-1', { discountPrice: 2000 })).rejects.toThrow(
      DomainException,
    );
  });

  it('accepts a valid discount against the stored price', async () => {
    courseRepository.findById.mockResolvedValue(
      buildCourse({ price: CoursePrice.create(2000, null) }),
    );

    await expect(useCase.execute('course-1', { discountPrice: 1500 })).resolves.toBeDefined();
  });

  it('404s when moving the course to a category that does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('course-1', { categoryId: 'ghost' })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('rejects a slug already taken by another course', async () => {
    courseRepository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute('course-1', { slug: 'taken-slug' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });
});

describe('PublishCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let useCase: PublishCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    useCase = new PublishCourseUseCase(courseRepository);
  });

  it('publishes a complete course', async () => {
    await useCase.execute('course-1', true);

    expect(courseRepository.update).toHaveBeenCalledWith('course-1', { isPublished: true });
  });

  it('clears the featured flag when unpublishing', async () => {
    await useCase.execute('course-1', false);

    expect(courseRepository.update).toHaveBeenCalledWith('course-1', {
      isPublished: false,
      isFeatured: false,
    });
  });

  it('refuses to publish a course with no Uzbek title', async () => {
    courseRepository.findById.mockResolvedValue(
      buildCourse({ title: { uz: '  ', ru: '', en: '' } }),
    );

    await expect(useCase.execute('course-1', true)).rejects.toThrow(BusinessRuleException);
  });

  it('refuses to publish a course with no Uzbek summary', async () => {
    courseRepository.findById.mockResolvedValue(
      buildCourse({ shortDescription: { uz: '', ru: '', en: '' } }),
    );

    await expect(useCase.execute('course-1', true)).rejects.toThrow(BusinessRuleException);
  });

  it('404s on an unknown course', async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', true)).rejects.toThrow(EntityNotFoundException);
  });
});

describe('FeatureCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let useCase: FeatureCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    useCase = new FeatureCourseUseCase(courseRepository);
  });

  it('features a published course', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ isPublished: true }));

    await useCase.execute('course-1', true);

    expect(courseRepository.update).toHaveBeenCalledWith('course-1', { isFeatured: true });
  });

  it('refuses to feature a draft, which would put a 404 on the home page', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ isPublished: false }));

    await expect(useCase.execute('course-1', true)).rejects.toThrow(BusinessRuleException);
  });

  it('always allows removing a course from the carousel', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ isPublished: false }));

    await expect(useCase.execute('course-1', false)).resolves.toBeDefined();
  });
});

describe('DeleteCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let useCase: DeleteCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    useCase = new DeleteCourseUseCase(courseRepository);
  });

  it('deletes a course with no groups', async () => {
    await useCase.execute('course-1');

    expect(courseRepository.delete).toHaveBeenCalledWith('course-1');
  });

  it('refuses to delete a course that still has groups', async () => {
    courseRepository.countGroups.mockResolvedValue(2);

    await expect(useCase.execute('course-1')).rejects.toThrow(BusinessRuleException);
    expect(courseRepository.delete).not.toHaveBeenCalled();
  });

  it('404s on an unknown course', async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('GetCourseUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let useCase: GetCourseUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    useCase = new GetCourseUseCase(courseRepository);
  });

  it('restricts the public lookup to published courses', async () => {
    await useCase.bySlug('frontend-react');

    expect(courseRepository.findBySlug).toHaveBeenCalledWith('frontend-react', true);
  });

  it('404s on an unpublished slug', async () => {
    courseRepository.findBySlug.mockResolvedValue(null);

    await expect(useCase.bySlug('draft-course')).rejects.toThrow(EntityNotFoundException);
  });

  it('flattens localised fields for the requested language', async () => {
    const result = await useCase.bySlug('frontend-react', Language.RU);

    expect(result.title).toBe('Фронтенд');
  });

  it('keeps the localised objects for the admin lookup', async () => {
    const result = await useCase.byId('course-1');

    expect(result.title).toEqual(expect.objectContaining({ uz: 'Frontend' }));
  });

  it('404s on an unknown id', async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(useCase.byId('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('ListCoursesUseCase', () => {
  let courseRepository: jest.Mocked<CourseRepository>;
  let useCase: ListCoursesUseCase;

  beforeEach(() => {
    courseRepository = buildCourseRepository();
    useCase = new ListCoursesUseCase(courseRepository);
  });

  it('forces isPublished on the public listing, whatever was asked for', async () => {
    await useCase.executePublic({ categorySlug: 'frontend' });

    expect(courseRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true, categorySlug: 'frontend' }),
    );
  });

  it('passes the price range through', async () => {
    await useCase.executePublic({ minPrice: 500_000, maxPrice: 2_000_000 });

    expect(courseRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 500_000, maxPrice: 2_000_000 }),
    );
  });

  it('lets the admin listing filter drafts explicitly', async () => {
    await useCase.execute({ isPublished: false });

    expect(courseRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: false }),
    );
  });

  it('caps the featured carousel at six courses', async () => {
    await useCase.executeFeatured();

    expect(courseRepository.findFeatured).toHaveBeenCalledWith(6);
  });
});
