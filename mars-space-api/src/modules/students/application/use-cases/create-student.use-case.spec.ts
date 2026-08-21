import { GroupStatus, StudentStatus } from '@prisma/client';
import { InvalidPhoneException } from '../../../../common/exceptions';
import { Group } from '../../../groups/domain/entities/group.entity';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { Student } from '../../domain/entities/student.entity';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { CreateStudentUseCase } from './create-student.use-case';

function buildGroup(
  activeStudents: number,
  capacity = 15,
  status: GroupStatus = GroupStatus.ACTIVE,
): Group {
  return new Group(
    'group-1',
    'FS-2026-01',
    'course-1',
    null,
    new Date('2026-09-01'),
    null,
    [],
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

const createdStudent = new Student(
  'student-1',
  'Abror Qodirov',
  '+998901234567',
  null,
  null,
  'group-1',
  StudentStatus.ACTIVE,
  null,
  new Date('2026-01-01'),
  new Date('2026-01-01'),
  new Date('2026-01-01'),
);

describe('CreateStudentUseCase', () => {
  let studentRepository: jest.Mocked<StudentRepository>;
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: CreateStudentUseCase;

  beforeEach(() => {
    studentRepository = {
      create: jest.fn().mockResolvedValue(createdStudent),
      createWithCapacityCheck: jest.fn().mockResolvedValue(createdStudent),
    } as unknown as jest.Mocked<StudentRepository>;

    groupRepository = { findById: jest.fn() } as unknown as jest.Mocked<GroupRepository>;

    useCase = new CreateStudentUseCase(studentRepository, groupRepository);
  });

  it('normalises the phone number before persisting', async () => {
    await useCase.execute({ fullName: 'Abror Qodirov', phone: '90 123 45 67' });

    expect(studentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+998901234567' }),
    );
  });

  it('rejects an unusable phone number with a 422', async () => {
    await expect(useCase.execute({ fullName: 'Abror', phone: '123' })).rejects.toThrow(
      InvalidPhoneException,
    );
    expect(studentRepository.create).not.toHaveBeenCalled();
  });

  it('creates without a capacity check when no group is given', async () => {
    await useCase.execute({ fullName: 'Abror Qodirov', phone: '+998901234567' });

    expect(studentRepository.create).toHaveBeenCalled();
    expect(studentRepository.createWithCapacityCheck).not.toHaveBeenCalled();
    expect(groupRepository.findById).not.toHaveBeenCalled();
  });

  it('enrols into a group that still has a free seat', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(14, 15));

    await useCase.execute({
      fullName: 'Abror Qodirov',
      phone: '+998901234567',
      groupId: 'group-1',
    });

    expect(studentRepository.createWithCapacityCheck).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 'group-1' }),
    );
  });

  it('refuses to enrol into a full group', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await expect(
      useCase.execute({ fullName: 'Abror', phone: '+998901234567', groupId: 'group-1' }),
    ).rejects.toThrow(GroupCapacityExceededError);

    expect(studentRepository.createWithCapacityCheck).not.toHaveBeenCalled();
  });

  it('refuses to enrol into a finished group even when seats remain', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(2, 15, GroupStatus.FINISHED));

    await expect(
      useCase.execute({ fullName: 'Abror', phone: '+998901234567', groupId: 'group-1' }),
    ).rejects.toThrow(GroupClosedForEnrolmentError);
  });

  it('lets a non-active student join a full group, since they take no seat', async () => {
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await useCase.execute({
      fullName: 'Abror',
      phone: '+998901234567',
      groupId: 'group-1',
      status: StudentStatus.FROZEN,
    });

    expect(studentRepository.createWithCapacityCheck).toHaveBeenCalled();
  });
});
