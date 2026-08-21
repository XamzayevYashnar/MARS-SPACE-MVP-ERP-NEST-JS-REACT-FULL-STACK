import { Language } from '../../../../common/enums/language.enum';
import {
  BusinessRuleException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { Teacher } from '../../domain/entities/teacher.entity';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';
import { CreateTeacherUseCase } from './create-teacher.use-case';
import { DeleteTeacherUseCase } from './delete-teacher.use-case';
import { GetTeacherUseCase } from './get-teacher.use-case';
import { ListTeachersUseCase } from './list-teachers.use-case';
import { ReorderTeachersUseCase } from './reorder-teachers.use-case';
import { UpdateTeacherUseCase } from './update-teacher.use-case';

function buildTeacher(overrides: Partial<Teacher> = {}): Teacher {
  return new Teacher(
    overrides.id ?? 'teacher-1',
    overrides.slug ?? 'jasur-yuldashev',
    overrides.fullName ?? 'Jasur Yuldashev',
    overrides.position ?? { uz: 'Dasturchi', ru: 'Разработчик', en: 'Developer' },
    overrides.bio ?? null,
    overrides.photoUrl ?? null,
    overrides.experienceYears ?? 7,
    overrides.skills ?? ['React'],
    overrides.socials ?? null,
    overrides.sortOrder ?? 1,
    overrides.isActive ?? true,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
    overrides.courses ?? [],
  );
}

function buildRepository(): jest.Mocked<TeacherRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildTeacher()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildTeacher()),
    findBySlug: jest.fn().mockResolvedValue(buildTeacher()),
    existsBySlug: jest.fn().mockResolvedValue(false),
    existsById: jest.fn().mockResolvedValue(true),
    create: jest.fn().mockImplementation(async (data) => buildTeacher({ slug: data.slug })),
    update: jest.fn().mockResolvedValue(buildTeacher()),
    delete: jest.fn().mockResolvedValue(undefined),
    countGroups: jest.fn().mockResolvedValue(0),
    reorder: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TeacherRepository>;
}

describe('CreateTeacherUseCase', () => {
  let repository: jest.Mocked<TeacherRepository>;
  let useCase: CreateTeacherUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new CreateTeacherUseCase(repository);
  });

  it('derives the slug from the full name', async () => {
    const result = await useCase.execute({
      fullName: 'Dilnoza Karimova',
      position: { uz: 'Backend muhandisi' },
    });

    expect(result.slug).toBe('dilnoza-karimova');
  });

  it('keeps safe formatting in the bio but strips it from the position', async () => {
    await useCase.execute({
      fullName: 'Jasur',
      position: { uz: '<b>Senior</b> dasturchi' },
      bio: { uz: '<p>Tajriba</p><script>x</script>' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        position: expect.objectContaining({ uz: 'Senior dasturchi' }),
        bio: expect.objectContaining({ uz: '<p>Tajriba</p>' }),
      }),
    );
  });

  it('rejects an explicit slug that is taken', async () => {
    repository.existsBySlug.mockResolvedValue(true);

    await expect(
      useCase.execute({ fullName: 'Jasur', position: { uz: 'Dasturchi' }, slug: 'taken' }),
    ).rejects.toThrow(EntityAlreadyExistsException);
  });

  it('applies the documented defaults', async () => {
    await useCase.execute({ fullName: 'Jasur', position: { uz: 'Dasturchi' } });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ experienceYears: 0, skills: [], sortOrder: 0, isActive: true }),
    );
  });
});

describe('UpdateTeacherUseCase', () => {
  let repository: jest.Mocked<TeacherRepository>;
  let useCase: UpdateTeacherUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new UpdateTeacherUseCase(repository);
  });

  it('404s on an unknown teacher', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { experienceYears: 8 })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('passes the course assignment through so it can be replaced wholesale', async () => {
    await useCase.execute('teacher-1', { courseIds: ['course-1', 'course-2'] });

    expect(repository.update).toHaveBeenCalledWith(
      'teacher-1',
      expect.objectContaining({ courseIds: ['course-1', 'course-2'] }),
    );
  });

  it('rejects a slug used by another teacher', async () => {
    repository.existsBySlug.mockResolvedValue(true);

    await expect(useCase.execute('teacher-1', { slug: 'someone-else' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });
});

describe('DeleteTeacherUseCase', () => {
  let repository: jest.Mocked<TeacherRepository>;
  let useCase: DeleteTeacherUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new DeleteTeacherUseCase(repository);
  });

  it('deletes a teacher who leads no groups', async () => {
    await useCase.execute('teacher-1');

    expect(repository.delete).toHaveBeenCalledWith('teacher-1');
  });

  it('refuses to delete a teacher who still leads groups', async () => {
    repository.countGroups.mockResolvedValue(3);

    await expect(useCase.execute('teacher-1')).rejects.toThrow(BusinessRuleException);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('404s on an unknown teacher', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('GetTeacherUseCase', () => {
  let repository: jest.Mocked<TeacherRepository>;
  let useCase: GetTeacherUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new GetTeacherUseCase(repository);
  });

  it('restricts the public lookup to active teachers', async () => {
    await useCase.bySlug('jasur-yuldashev');

    expect(repository.findBySlug).toHaveBeenCalledWith('jasur-yuldashev', true);
  });

  it('flattens the position for the requested language', async () => {
    const result = await useCase.bySlug('jasur-yuldashev', Language.RU);

    expect(result.position).toBe('Разработчик');
  });

  it('404s on an inactive or unknown slug', async () => {
    repository.findBySlug.mockResolvedValue(null);

    await expect(useCase.bySlug('hidden')).rejects.toThrow(EntityNotFoundException);
  });

  it('404s on an unknown id', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.byId('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('ListTeachersUseCase', () => {
  let repository: jest.Mocked<TeacherRepository>;
  let useCase: ListTeachersUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new ListTeachersUseCase(repository);
  });

  it('sorts by sortOrder ascending by default', async () => {
    await useCase.execute({});

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'sortOrder', sortOrder: 'asc' }),
    );
  });

  it('honours an explicit sort on the admin listing', async () => {
    await useCase.execute({ sortBy: 'experienceYears', sortOrder: 'desc' as never });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'experienceYears', sortOrder: 'desc' }),
    );
  });

  it('restricts the public listing to active teachers', async () => {
    await useCase.executePublic({});

    expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });

  it('filters the admin listing by course', async () => {
    await useCase.execute({ courseId: 'course-1' });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1' }),
    );
  });
});

describe('ReorderTeachersUseCase', () => {
  it('applies the whole ordering in one call', async () => {
    const repository = buildRepository();
    const useCase = new ReorderTeachersUseCase(repository);
    const items = [{ id: 'teacher-1', sortOrder: 0 }];

    await useCase.execute({ items });

    expect(repository.reorder).toHaveBeenCalledWith(items);
  });
});
