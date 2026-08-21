import { GroupStatus, WeekDay } from '@prisma/client';
import {
  BusinessRuleException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { TeacherRepository } from '../../../teachers/domain/repositories/teacher.repository';
import { Group } from '../../domain/entities/group.entity';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { CreateGroupUseCase } from './create-group.use-case';
import { DeleteGroupUseCase } from './delete-group.use-case';
import { GetGroupUseCase } from './get-group.use-case';
import { ListGroupsUseCase } from './list-groups.use-case';
import { UpdateGroupStatusUseCase } from './update-group-status.use-case';
import { UpdateGroupUseCase } from './update-group.use-case';

function buildGroup(overrides: Partial<Group> = {}): Group {
  return new Group(
    overrides.id ?? 'group-1',
    overrides.name ?? 'FS-2026-01',
    overrides.courseId ?? 'course-1',
    overrides.teacherId ?? null,
    overrides.startDate ?? new Date('2026-09-01'),
    overrides.endDate ?? null,
    overrides.weekDays ?? [WeekDay.MON],
    overrides.startTime ?? '18:00',
    overrides.endTime ?? '19:30',
    overrides.roomName ?? null,
    overrides.capacity ?? 15,
    overrides.status ?? GroupStatus.FORMING,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
    overrides.activeStudentsCount ?? 0,
  );
}

function buildGroupRepository(): jest.Mocked<GroupRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildGroup()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildGroup()),
    existsByName: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockImplementation(async (data) => buildGroup({ name: data.name })),
    update: jest.fn().mockResolvedValue(buildGroup()),
    delete: jest.fn().mockResolvedValue(undefined),
    countStudents: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<GroupRepository>;
}

const courseRepository = {
  existsById: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<CourseRepository>;

const teacherRepository = {
  existsById: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<TeacherRepository>;

const baseDto = {
  name: 'FS-2026-03',
  courseId: 'course-1',
  startDate: '2026-09-01',
  weekDays: [WeekDay.MON, WeekDay.WED],
  startTime: '18:00',
  endTime: '19:30',
};

describe('CreateGroupUseCase', () => {
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: CreateGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository.existsById.mockResolvedValue(true);
    teacherRepository.existsById.mockResolvedValue(true);
    groupRepository = buildGroupRepository();
    useCase = new CreateGroupUseCase(groupRepository, courseRepository, teacherRepository);
  });

  it('creates a group with the documented default capacity', async () => {
    await useCase.execute(baseDto);

    expect(groupRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'FS-2026-03', capacity: 15 }),
    );
  });

  it('rejects a duplicate intake code', async () => {
    groupRepository.existsByName.mockResolvedValue(true);

    await expect(useCase.execute(baseDto)).rejects.toThrow(EntityAlreadyExistsException);
  });

  it('404s when the course does not exist', async () => {
    courseRepository.existsById.mockResolvedValue(false);

    await expect(useCase.execute(baseDto)).rejects.toThrow(EntityNotFoundException);
  });

  it('404s when the teacher does not exist', async () => {
    teacherRepository.existsById.mockResolvedValue(false);

    await expect(useCase.execute({ ...baseDto, teacherId: 'ghost' })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('rejects an end time before the start time', async () => {
    await expect(
      useCase.execute({ ...baseDto, startTime: '19:30', endTime: '18:00' }),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      useCase.execute({ ...baseDto, startDate: '2026-09-01', endDate: '2026-08-01' }),
    ).rejects.toThrow(BusinessRuleException);
  });
});

describe('UpdateGroupUseCase', () => {
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: UpdateGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository.existsById.mockResolvedValue(true);
    teacherRepository.existsById.mockResolvedValue(true);
    groupRepository = buildGroupRepository();
    useCase = new UpdateGroupUseCase(groupRepository, courseRepository, teacherRepository);
  });

  it('404s on an unknown group', async () => {
    groupRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { capacity: 20 })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('validates the resulting schedule against the stored values', async () => {
    groupRepository.findById.mockResolvedValue(
      buildGroup({ startTime: '18:00', endTime: '19:30' }),
    );

    // Only endTime changes, but the pair it forms with the stored startTime is invalid.
    await expect(useCase.execute('group-1', { endTime: '17:00' })).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('refuses to shrink the capacity below the current roster', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup({ activeStudentsCount: 12 }));

    await expect(useCase.execute('group-1', { capacity: 10 })).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('allows a capacity equal to the current roster', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup({ activeStudentsCount: 12 }));

    await expect(useCase.execute('group-1', { capacity: 12 })).resolves.toBeDefined();
  });

  it('rejects a name already used by another group', async () => {
    groupRepository.existsByName.mockResolvedValue(true);

    await expect(useCase.execute('group-1', { name: 'BE-2026-01' })).rejects.toThrow(
      EntityAlreadyExistsException,
    );
  });
});

describe('UpdateGroupStatusUseCase', () => {
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: UpdateGroupStatusUseCase;

  beforeEach(() => {
    groupRepository = buildGroupRepository();
    useCase = new UpdateGroupStatusUseCase(groupRepository);
  });

  it('moves a forming group to active', async () => {
    await useCase.execute('group-1', GroupStatus.ACTIVE);

    expect(groupRepository.update).toHaveBeenCalledWith('group-1', {
      status: GroupStatus.ACTIVE,
    });
  });

  it('refuses to reopen a finished group', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup({ status: GroupStatus.FINISHED }));

    await expect(useCase.execute('group-1', GroupStatus.ACTIVE)).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('allows re-setting a finished group to FINISHED', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup({ status: GroupStatus.FINISHED }));

    await expect(useCase.execute('group-1', GroupStatus.FINISHED)).resolves.toBeDefined();
  });

  it('404s on an unknown group', async () => {
    groupRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', GroupStatus.ACTIVE)).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('DeleteGroupUseCase', () => {
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: DeleteGroupUseCase;

  beforeEach(() => {
    groupRepository = buildGroupRepository();
    useCase = new DeleteGroupUseCase(groupRepository);
  });

  it('deletes an empty group', async () => {
    await useCase.execute('group-1');

    expect(groupRepository.delete).toHaveBeenCalledWith('group-1');
  });

  it('refuses to delete a group that still holds students', async () => {
    groupRepository.countStudents.mockResolvedValue(5);

    await expect(useCase.execute('group-1')).rejects.toThrow(BusinessRuleException);
    expect(groupRepository.delete).not.toHaveBeenCalled();
  });

  it('404s on an unknown group', async () => {
    groupRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('GetGroupUseCase', () => {
  it('returns the group with its computed free seats', async () => {
    const groupRepository = buildGroupRepository();
    groupRepository.findById.mockResolvedValue(
      buildGroup({ capacity: 15, activeStudentsCount: 11 }),
    );

    const result = await new GetGroupUseCase(groupRepository).execute('group-1');

    expect(result).toMatchObject({ capacity: 15, activeStudentsCount: 11, freeSeats: 4 });
  });

  it('404s on an unknown group', async () => {
    const groupRepository = buildGroupRepository();
    groupRepository.findById.mockResolvedValue(null);

    await expect(new GetGroupUseCase(groupRepository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('ListGroupsUseCase', () => {
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: ListGroupsUseCase;

  beforeEach(() => {
    groupRepository = buildGroupRepository();
    useCase = new ListGroupsUseCase(groupRepository);
  });

  it('passes the admin filters through', async () => {
    await useCase.execute({ courseId: 'course-1', status: GroupStatus.ACTIVE });

    expect(groupRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1', status: GroupStatus.ACTIVE }),
    );
  });

  it('restricts the public listing to upcoming intakes, soonest first', async () => {
    await useCase.executeUpcoming({});

    expect(groupRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ upcomingOnly: true, sortBy: 'startDate', sortOrder: 'asc' }),
    );
  });
});
