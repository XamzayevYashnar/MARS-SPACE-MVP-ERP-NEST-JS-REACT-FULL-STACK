import { GroupStatus, StudentStatus, WeekDay } from '@prisma/client';
import {
  BusinessRuleException,
  EntityNotFoundException,
  InvalidPhoneException,
} from '../../../../common/exceptions';
import { Group } from '../../../groups/domain/entities/group.entity';
import { GroupCapacityExceededError } from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { Student } from '../../domain/entities/student.entity';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { DeleteStudentUseCase } from './delete-student.use-case';
import { GetStudentUseCase } from './get-student.use-case';
import { ListStudentsUseCase } from './list-students.use-case';
import { MoveStudentUseCase } from './move-student.use-case';
import { UpdateStudentUseCase } from './update-student.use-case';

function buildStudent(overrides: Partial<Student> = {}): Student {
  return new Student(
    overrides.id ?? 'student-1',
    overrides.fullName ?? 'Abror Qodirov',
    overrides.phone ?? '+998901234567',
    overrides.email ?? null,
    overrides.birthDate ?? null,
    overrides.groupId ?? 'group-1',
    overrides.status ?? StudentStatus.ACTIVE,
    overrides.note ?? null,
    overrides.enrolledAt ?? new Date('2026-01-01'),
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

function buildGroup(
  activeStudents = 0,
  capacity = 15,
  status: GroupStatus = GroupStatus.ACTIVE,
  id = 'group-2',
): Group {
  return new Group(
    id,
    'FS-2026-02',
    'course-1',
    null,
    new Date('2026-09-01'),
    null,
    [WeekDay.MON],
    '18:00',
    '19:30',
    null,
    capacity,
    status,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
    activeStudents,
  );
}

function buildStudentRepository(): jest.Mocked<StudentRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildStudent()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildStudent()),
    findByPhone: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(buildStudent()),
    createWithCapacityCheck: jest.fn().mockResolvedValue(buildStudent()),
    moveToGroupWithCapacityCheck: jest.fn().mockResolvedValue(buildStudent({ groupId: 'group-2' })),
    update: jest.fn().mockResolvedValue(buildStudent()),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<StudentRepository>;
}

describe('UpdateStudentUseCase', () => {
  let studentRepository: jest.Mocked<StudentRepository>;
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: UpdateStudentUseCase;

  beforeEach(() => {
    studentRepository = buildStudentRepository();
    groupRepository = { findById: jest.fn() } as unknown as jest.Mocked<GroupRepository>;
    useCase = new UpdateStudentUseCase(studentRepository, groupRepository);
  });

  it('404s on an unknown student', async () => {
    studentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { note: 'x' })).rejects.toThrow(EntityNotFoundException);
  });

  it('normalises a changed phone number', async () => {
    await useCase.execute('student-1', { phone: '90 111 22 33' });

    expect(studentRepository.update).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ phone: '+998901112233' }),
    );
  });

  it('rejects an unusable phone number', async () => {
    await expect(useCase.execute('student-1', { phone: '123' })).rejects.toThrow(
      InvalidPhoneException,
    );
  });

  it('does not re-check capacity when the student stays put', async () => {
    await useCase.execute('student-1', { note: 'Yangi izoh' });

    expect(groupRepository.findById).not.toHaveBeenCalled();
  });

  it('checks the target group when the student moves', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(2));

    await useCase.execute('student-1', { groupId: 'group-2' });

    expect(groupRepository.findById).toHaveBeenCalledWith('group-2');
  });

  it('refuses to move a student into a full group', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await expect(useCase.execute('student-1', { groupId: 'group-2' })).rejects.toThrow(
      GroupCapacityExceededError,
    );
  });

  it('checks capacity when a frozen student is reactivated in place', async () => {
    studentRepository.findById.mockResolvedValue(buildStudent({ status: StudentStatus.FROZEN }));
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15, GroupStatus.ACTIVE, 'group-1'));

    await expect(useCase.execute('student-1', { status: StudentStatus.ACTIVE })).rejects.toThrow(
      GroupCapacityExceededError,
    );
  });

  it('lets a student be frozen even in a full group, since they free their seat', async () => {
    await expect(
      useCase.execute('student-1', { status: StudentStatus.FROZEN }),
    ).resolves.toBeDefined();
    expect(groupRepository.findById).not.toHaveBeenCalled();
  });
});

describe('MoveStudentUseCase', () => {
  let studentRepository: jest.Mocked<StudentRepository>;
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: MoveStudentUseCase;

  beforeEach(() => {
    studentRepository = buildStudentRepository();
    groupRepository = {
      findById: jest.fn().mockResolvedValue(buildGroup(3)),
    } as unknown as jest.Mocked<GroupRepository>;
    useCase = new MoveStudentUseCase(studentRepository, groupRepository);
  });

  it('moves an active student into a group with room', async () => {
    const result = await useCase.execute('student-1', 'group-2');

    expect(result.groupId).toBe('group-2');
    expect(studentRepository.moveToGroupWithCapacityCheck).toHaveBeenCalledWith(
      'student-1',
      'group-2',
    );
  });

  it('rejects a move to the group the student is already in', async () => {
    await expect(useCase.execute('student-1', 'group-1')).rejects.toThrow(BusinessRuleException);
  });

  it('refuses to move into a full group', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await expect(useCase.execute('student-1', 'group-2')).rejects.toThrow(
      GroupCapacityExceededError,
    );
  });

  it('moves a non-active student into a full group, since they take no seat', async () => {
    studentRepository.findById.mockResolvedValue(buildStudent({ status: StudentStatus.FROZEN }));
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await expect(useCase.execute('student-1', 'group-2')).resolves.toBeDefined();
  });

  it('404s on an unknown student', async () => {
    studentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', 'group-2')).rejects.toThrow(EntityNotFoundException);
  });

  it('404s on an unknown group', async () => {
    groupRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('student-1', 'ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('DeleteStudentUseCase', () => {
  it('deletes an existing student', async () => {
    const repository = buildStudentRepository();

    await new DeleteStudentUseCase(repository).execute('student-1');

    expect(repository.delete).toHaveBeenCalledWith('student-1');
  });

  it('404s on an unknown student', async () => {
    const repository = buildStudentRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new DeleteStudentUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('GetStudentUseCase', () => {
  it('returns the student', async () => {
    const repository = buildStudentRepository();

    const result = await new GetStudentUseCase(repository).execute('student-1');

    expect(result).toMatchObject({ id: 'student-1', phone: '+998901234567' });
  });

  it('404s on an unknown student', async () => {
    const repository = buildStudentRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new GetStudentUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('ListStudentsUseCase', () => {
  it('passes the filters through', async () => {
    const repository = buildStudentRepository();

    await new ListStudentsUseCase(repository).execute({
      groupId: 'group-1',
      courseId: 'course-1',
      status: StudentStatus.ACTIVE,
    });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'group-1',
        courseId: 'course-1',
        status: StudentStatus.ACTIVE,
      }),
    );
  });
});
