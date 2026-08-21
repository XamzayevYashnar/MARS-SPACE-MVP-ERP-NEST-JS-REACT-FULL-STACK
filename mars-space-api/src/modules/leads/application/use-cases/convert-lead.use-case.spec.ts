import { GroupStatus, LeadSource, LeadStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { Group } from '../../../groups/domain/entities/group.entity';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { Lead } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { ConvertLeadUseCase } from './convert-lead.use-case';

function buildLead(status: LeadStatus): Lead {
  return new Lead(
    'lead-1',
    'Ulugbek Ismatullayev',
    '+998901234567',
    'course-1',
    null,
    LeadSource.WEBSITE_FORM,
    status,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    new Date('2026-08-01'),
    new Date('2026-08-01'),
  );
}

function buildGroup(
  activeStudents: number,
  capacity = 15,
  status: GroupStatus = GroupStatus.FORMING,
): Group {
  return new Group(
    'group-1',
    'FS-2026-02',
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

describe('ConvertLeadUseCase', () => {
  let leadRepository: jest.Mocked<LeadRepository>;
  let groupRepository: jest.Mocked<GroupRepository>;
  let useCase: ConvertLeadUseCase;

  beforeEach(() => {
    leadRepository = {
      findById: jest.fn(),
      convertToStudent: jest.fn().mockResolvedValue({
        lead: buildLead(LeadStatus.ENROLLED),
        studentId: 'student-1',
      }),
    } as unknown as jest.Mocked<LeadRepository>;

    groupRepository = { findById: jest.fn() } as unknown as jest.Mocked<GroupRepository>;

    useCase = new ConvertLeadUseCase(leadRepository, groupRepository);
  });

  it('converts a new lead and returns both the lead and the student id', async () => {
    leadRepository.findById.mockResolvedValue(buildLead(LeadStatus.CONTACTED));
    groupRepository.findById.mockResolvedValue(buildGroup(3));

    const result = await useCase.execute('lead-1', { groupId: 'group-1', note: 'Bo‘lib to‘laydi' });

    expect(result.studentId).toBe('student-1');
    expect(result.lead.status).toBe(LeadStatus.ENROLLED);
    expect(leadRepository.convertToStudent).toHaveBeenCalledWith({
      leadId: 'lead-1',
      groupId: 'group-1',
      note: 'Bo‘lib to‘laydi',
    });
  });

  it('is idempotent by refusal: a second conversion is a conflict, not a second student', async () => {
    leadRepository.findById.mockResolvedValue(buildLead(LeadStatus.ENROLLED));

    await expect(useCase.execute('lead-1', { groupId: 'group-1' })).rejects.toThrow(
      BusinessRuleException,
    );
    expect(leadRepository.convertToStudent).not.toHaveBeenCalled();
  });

  it('404s on an unknown lead', async () => {
    leadRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', { groupId: 'group-1' })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('404s on an unknown group', async () => {
    leadRepository.findById.mockResolvedValue(buildLead(LeadStatus.NEW));
    groupRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('lead-1', { groupId: 'ghost' })).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('refuses to convert into a full group', async () => {
    leadRepository.findById.mockResolvedValue(buildLead(LeadStatus.NEW));
    groupRepository.findById.mockResolvedValue(buildGroup(15, 15));

    await expect(useCase.execute('lead-1', { groupId: 'group-1' })).rejects.toThrow(
      GroupCapacityExceededError,
    );
    expect(leadRepository.convertToStudent).not.toHaveBeenCalled();
  });

  it('refuses to convert into a cancelled group', async () => {
    leadRepository.findById.mockResolvedValue(buildLead(LeadStatus.NEW));
    groupRepository.findById.mockResolvedValue(buildGroup(1, 15, GroupStatus.CANCELLED));

    await expect(useCase.execute('lead-1', { groupId: 'group-1' })).rejects.toThrow(
      GroupClosedForEnrolmentError,
    );
  });
});
