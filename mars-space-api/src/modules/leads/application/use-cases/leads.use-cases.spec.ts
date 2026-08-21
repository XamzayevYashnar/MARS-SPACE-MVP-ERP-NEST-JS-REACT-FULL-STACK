import { LeadSource, LeadStatus, UserRole } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { Lead } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { AssignLeadUseCase } from './assign-lead.use-case';
import { DeleteLeadUseCase } from './delete-lead.use-case';
import { GetLeadUseCase } from './get-lead.use-case';
import { ListLeadsUseCase } from './list-leads.use-case';
import { UpdateLeadNoteUseCase } from './update-lead-note.use-case';
import { UpdateLeadStatusUseCase } from './update-lead-status.use-case';

function buildLead(overrides: Partial<Lead> = {}): Lead {
  const contactedAt = 'contactedAt' in overrides ? (overrides.contactedAt ?? null) : null;

  return new Lead(
    overrides.id ?? 'lead-1',
    overrides.fullName ?? 'Ulugbek',
    overrides.phone ?? '+998901234567',
    overrides.courseId ?? null,
    overrides.message ?? null,
    overrides.source ?? LeadSource.WEBSITE_FORM,
    overrides.status ?? LeadStatus.NEW,
    overrides.assignedToId ?? null,
    overrides.adminNote ?? null,
    overrides.utmSource ?? null,
    overrides.utmMedium ?? null,
    overrides.utmCampaign ?? null,
    overrides.pageUrl ?? null,
    contactedAt,
    overrides.createdAt ?? new Date('2026-08-01'),
    overrides.updatedAt ?? new Date('2026-08-01'),
  );
}

function buildRepository(): jest.Mocked<LeadRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildLead()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildLead()),
    create: jest.fn().mockResolvedValue(buildLead()),
    update: jest.fn().mockResolvedValue(buildLead()),
    delete: jest.fn().mockResolvedValue(undefined),
    convertToStudent: jest.fn(),
    countByStatus: jest.fn(),
    countSince: jest.fn(),
    trend: jest.fn(),
    topCourses: jest.fn(),
    recent: jest.fn(),
  } as unknown as jest.Mocked<LeadRepository>;
}

describe('UpdateLeadStatusUseCase', () => {
  let repository: jest.Mocked<LeadRepository>;
  let useCase: UpdateLeadStatusUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new UpdateLeadStatusUseCase(repository);
  });

  it('stamps contactedAt the first time the lead leaves NEW', async () => {
    await useCase.execute('lead-1', LeadStatus.IN_PROGRESS);

    expect(repository.update).toHaveBeenCalledWith('lead-1', {
      status: LeadStatus.IN_PROGRESS,
      contactedAt: expect.any(Date),
    });
  });

  it('does not re-stamp contactedAt on a later move', async () => {
    repository.findById.mockResolvedValue(
      buildLead({ status: LeadStatus.IN_PROGRESS, contactedAt: new Date('2026-08-02') }),
    );

    await useCase.execute('lead-1', LeadStatus.CONTACTED);

    expect(repository.update).toHaveBeenCalledWith('lead-1', { status: LeadStatus.CONTACTED });
  });

  it('does not stamp contactedAt when the status stays NEW', async () => {
    await useCase.execute('lead-1', LeadStatus.NEW);

    expect(repository.update).toHaveBeenCalledWith('lead-1', { status: LeadStatus.NEW });
  });

  it('refuses to set ENROLLED by hand, since no student would be created', async () => {
    await expect(useCase.execute('lead-1', LeadStatus.ENROLLED)).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('allows ENROLLED on an already-converted lead, which is a no-op', async () => {
    repository.findById.mockResolvedValue(buildLead({ status: LeadStatus.ENROLLED }));

    await expect(useCase.execute('lead-1', LeadStatus.ENROLLED)).resolves.toBeDefined();
  });

  it('404s on an unknown lead', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', LeadStatus.CONTACTED)).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('AssignLeadUseCase', () => {
  let repository: jest.Mocked<LeadRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: AssignLeadUseCase;

  const activeUser = new User(
    'user-1',
    'Manager',
    'manager@marsspace.uz',
    null,
    'hash',
    UserRole.MANAGER,
    null,
    true,
    null,
    new Date(),
    new Date(),
  );

  beforeEach(() => {
    repository = buildRepository();
    userRepository = {
      findById: jest.fn().mockResolvedValue(activeUser),
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new AssignLeadUseCase(repository, userRepository);
  });

  it('assigns the lead to an active staff member', async () => {
    await useCase.execute('lead-1', 'user-1');

    expect(repository.update).toHaveBeenCalledWith('lead-1', { assignedToId: 'user-1' });
  });

  it('unassigns the lead back to the queue', async () => {
    await useCase.execute('lead-1', null);

    expect(repository.update).toHaveBeenCalledWith('lead-1', { assignedToId: null });
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('refuses to hand work to a deactivated account', async () => {
    userRepository.findById.mockResolvedValue(
      new User(
        'user-1',
        'Manager',
        'manager@marsspace.uz',
        null,
        'hash',
        UserRole.MANAGER,
        null,
        false,
        null,
        new Date(),
        new Date(),
      ),
    );

    await expect(useCase.execute('lead-1', 'user-1')).rejects.toThrow(EntityNotFoundException);
  });

  it('404s on an unknown assignee', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('lead-1', 'ghost')).rejects.toThrow(EntityNotFoundException);
  });

  it('404s on an unknown lead', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('ghost', 'user-1')).rejects.toThrow(EntityNotFoundException);
  });
});

describe('UpdateLeadNoteUseCase', () => {
  it('stores the note as plain text', async () => {
    const repository = buildRepository();

    await new UpdateLeadNoteUseCase(repository).execute('lead-1', '<b>Qayta</b> qo‘ng‘iroq');

    expect(repository.update).toHaveBeenCalledWith('lead-1', {
      adminNote: 'Qayta qo‘ng‘iroq',
    });
  });

  it('404s on an unknown lead', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new UpdateLeadNoteUseCase(repository).execute('ghost', 'x')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});

describe('ListLeadsUseCase', () => {
  let repository: jest.Mocked<LeadRepository>;
  let useCase: ListLeadsUseCase;

  beforeEach(() => {
    repository = buildRepository();
    useCase = new ListLeadsUseCase(repository);
  });

  it('passes the pipeline filters through', async () => {
    await useCase.execute({
      status: LeadStatus.CONTACTED,
      courseId: 'course-1',
      assignedToId: 'user-1',
    });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LeadStatus.CONTACTED,
        courseId: 'course-1',
        assignedToId: 'user-1',
      }),
    );
  });

  it('extends dateTo to the end of that day, so the range includes it', async () => {
    await useCase.execute({ dateFrom: '2026-08-01', dateTo: '2026-08-31' });

    const query = repository.findMany.mock.calls[0][0];
    expect(query.dateTo?.getHours()).toBe(23);
    expect(query.dateTo?.getMinutes()).toBe(59);
  });

  it('leaves the date range absent when neither bound is given', async () => {
    await useCase.execute({});

    const query = repository.findMany.mock.calls[0][0];
    expect(query.dateFrom).toBeUndefined();
    expect(query.dateTo).toBeUndefined();
  });
});

describe('GetLeadUseCase and DeleteLeadUseCase', () => {
  it('reads a lead', async () => {
    const repository = buildRepository();

    await expect(new GetLeadUseCase(repository).execute('lead-1')).resolves.toMatchObject({
      id: 'lead-1',
    });
  });

  it('404s on an unknown lead', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new GetLeadUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('deletes a lead', async () => {
    const repository = buildRepository();

    await new DeleteLeadUseCase(repository).execute('lead-1');

    expect(repository.delete).toHaveBeenCalledWith('lead-1');
  });

  it('404s when deleting an unknown lead', async () => {
    const repository = buildRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new DeleteLeadUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});
