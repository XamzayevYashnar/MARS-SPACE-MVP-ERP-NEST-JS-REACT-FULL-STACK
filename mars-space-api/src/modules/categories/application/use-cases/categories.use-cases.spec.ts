import {
  BusinessRuleException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { Language } from '../../../../common/enums/language.enum';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { CreateCategoryUseCase } from './create-category.use-case';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { GetCategoryUseCase } from './get-category.use-case';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { ReorderCategoriesUseCase } from './reorder-categories.use-case';
import { UpdateCategoryUseCase } from './update-category.use-case';

function buildCategory(overrides: Partial<Category> = {}): Category {
  return new Category(
    overrides.id ?? 'cat-1',
    overrides.slug ?? 'frontend',
    overrides.name ?? { uz: 'Frontend', ru: 'Фронтенд', en: 'Frontend' },
    overrides.description ?? null,
    overrides.iconKey ?? null,
    overrides.colorHex ?? null,
    overrides.sortOrder ?? 1,
    overrides.isActive ?? true,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
    overrides.coursesCount ?? 3,
  );
}

function buildRepository(): jest.Mocked<CategoryRepository> {
  return {
    findMany: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockImplementation(async (data) => buildCategory({ slug: data.slug })),
    update: jest.fn().mockResolvedValue(buildCategory()),
    delete: jest.fn().mockResolvedValue(undefined),
    countCourses: jest.fn().mockResolvedValue(0),
    reorder: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CategoryRepository>;
}

describe('CreateCategoryUseCase', () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new CreateCategoryUseCase(repository);
  });

  it('derives the slug from name.uz when none is supplied', async () => {
    const result = await useCase.execute({ name: { uz: 'Mobil dasturlash' } });

    expect(result.slug).toBe('mobil-dasturlash');
  });

  it('normalises the name into all three locales', async () => {
    await useCase.execute({ name: { uz: '  Frontend  ', ru: 'Фронтенд' } });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: { uz: 'Frontend', ru: 'Фронтенд', en: '' } }),
    );
  });

  it('strips markup out of the name', async () => {
    await useCase.execute({ name: { uz: '<b>Frontend</b>' } });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.objectContaining({ uz: 'Frontend' }) }),
    );
  });

  it('rejects an explicit slug that is already taken', async () => {
    repository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute({ name: { uz: 'Frontend' }, slug: 'frontend' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });

  it('applies the documented defaults', async () => {
    await useCase.execute({ name: { uz: 'Frontend' } });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: 0, isActive: true, description: null }),
    );
  });
});

describe('UpdateCategoryUseCase', () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: UpdateCategoryUseCase;

  beforeEach(() => {
    repository = buildRepository();
    repository.findById.mockResolvedValue(buildCategory());
    useCase = new UpdateCategoryUseCase(repository);
  });

  it('404s on an unknown category', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { sortOrder: 2 })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('applies a partial update without touching absent fields', async () => {
    await useCase.execute('cat-1', { sortOrder: 5 });

    expect(repository.update).toHaveBeenCalledWith(
      'cat-1',
      expect.objectContaining({ sortOrder: 5, name: undefined, slug: undefined }),
    );
  });

  it('rejects a slug already used by another category', async () => {
    repository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute('cat-1', { slug: 'backend' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });

  it('allows re-submitting the category’s own slug', async () => {
    await expect(useCase.execute('cat-1', { slug: 'frontend' })).resolves.toBeDefined();
    expect(repository.existsBySlug).not.toHaveBeenCalled();
  });
});

describe('DeleteCategoryUseCase', () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: DeleteCategoryUseCase;

  beforeEach(() => {
    repository = buildRepository();
    repository.findById.mockResolvedValue(buildCategory());
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('deletes an empty category', async () => {
    await useCase.execute('cat-1');

    expect(repository.delete).toHaveBeenCalledWith('cat-1');
  });

  it('refuses to delete a category that still holds courses', async () => {
    repository.countCourses.mockResolvedValue(4);

    await expect(useCase.execute('cat-1')).rejects.toThrow(BusinessRuleException);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('404s on an unknown category', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('GetCategoryUseCase', () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: GetCategoryUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new GetCategoryUseCase(repository);
  });

  it('returns the localised object for an admin lookup', async () => {
    repository.findById.mockResolvedValue(buildCategory());

    const result = await useCase.byId('cat-1');

    expect(result.name).toEqual({ uz: 'Frontend', ru: 'Фронтенд', en: 'Frontend' });
  });

  it('flattens the name when a public lookup asks for a language', async () => {
    repository.findBySlug.mockResolvedValue(buildCategory());

    const result = await useCase.bySlug('frontend', Language.RU);

    expect(result.name).toBe('Фронтенд');
  });

  it('restricts the public lookup to active categories', async () => {
    repository.findBySlug.mockResolvedValue(buildCategory());

    await useCase.bySlug('frontend');

    expect(repository.findBySlug).toHaveBeenCalledWith('frontend', true);
  });

  it('404s on an inactive or unknown slug', async () => {
    repository.findBySlug.mockResolvedValue(null);

    await expect(useCase.bySlug('hidden')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('ListCategoriesUseCase', () => {
  let repository: jest.Mocked<CategoryRepository>;
  let useCase: ListCategoriesUseCase;

  beforeEach(() => {
    repository = buildRepository();
    repository.findMany.mockResolvedValue({
      items: [buildCategory()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    });
    useCase = new ListCategoriesUseCase(repository);
  });

  it('sorts by sortOrder ascending by default', async () => {
    await useCase.execute({});

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'sortOrder', sortOrder: 'asc' }),
    );
  });

  it('forces the public listing to active categories and published course counts', async () => {
    await useCase.executePublic({});

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, publishedCoursesOnly: true }),
    );
  });

  it('counts every course for the admin listing', async () => {
    await useCase.execute({});

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ publishedCoursesOnly: false }),
    );
  });
});

describe('ReorderCategoriesUseCase', () => {
  it('hands the whole ordering to the repository in one call', async () => {
    const repository = buildRepository();
    const useCase = new ReorderCategoriesUseCase(repository);
    const items = [
      { id: 'cat-1', sortOrder: 0 },
      { id: 'cat-2', sortOrder: 1 },
    ];

    await useCase.execute({ items });

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
