import { LeadSource, LeadStatus } from '@prisma/client';
import { InvalidPhoneException } from '../../../../common/exceptions';
import { TelegramNotifier } from '../../../../core/notification/telegram.notifier';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { Lead } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { CreateLeadUseCase } from './create-lead.use-case';

const storedLead = new Lead(
  'lead-1',
  'Ulugbek Ismatullayev',
  '+998901234567',
  null,
  'Kurs narxi qiziqtiryapti',
  LeadSource.WEBSITE_FORM,
  LeadStatus.NEW,
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

describe('CreateLeadUseCase', () => {
  let leadRepository: jest.Mocked<LeadRepository>;
  let courseRepository: jest.Mocked<CourseRepository>;
  let telegramNotifier: jest.Mocked<TelegramNotifier>;
  let useCase: CreateLeadUseCase;

  beforeEach(() => {
    leadRepository = {
      create: jest.fn().mockResolvedValue(storedLead),
    } as unknown as jest.Mocked<LeadRepository>;

    courseRepository = { findById: jest.fn() } as unknown as jest.Mocked<CourseRepository>;

    telegramNotifier = {
      notifyNewLead: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TelegramNotifier>;

    useCase = new CreateLeadUseCase(leadRepository, courseRepository, telegramNotifier);
  });

  it('stores the lead and fires the Telegram alert', async () => {
    const result = await useCase.execute({ fullName: 'Ulugbek', phone: '90 123 45 67' });

    expect(result.accepted).toBe(true);
    expect(leadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+998901234567', source: LeadSource.WEBSITE_FORM }),
    );
    expect(telegramNotifier.notifyNewLead).toHaveBeenCalledTimes(1);
  });

  it('never returns the stored lead id, so the endpoint cannot be used to enumerate', async () => {
    const result = await useCase.execute({ fullName: 'Ulugbek', phone: '+998901234567' });

    expect(JSON.stringify(result)).not.toContain('lead-1');
    expect(Object.keys(result).sort()).toEqual(['accepted', 'message']);
  });

  it('silently drops a submission that filled the honeypot', async () => {
    const result = await useCase.execute({
      fullName: 'Bot',
      phone: '+998901234567',
      website: 'http://spam.example',
    });

    // The bot gets the same acknowledgement a human does, and nothing is stored.
    expect(result.accepted).toBe(true);
    expect(leadRepository.create).not.toHaveBeenCalled();
    expect(telegramNotifier.notifyNewLead).not.toHaveBeenCalled();
  });

  it('rejects an unusable phone number', async () => {
    await expect(useCase.execute({ fullName: 'Ulugbek', phone: 'not-a-number' })).rejects.toThrow(
      InvalidPhoneException,
    );
  });

  it('strips markup out of the free-text fields', async () => {
    await useCase.execute({
      fullName: '<b>Ulugbek</b>',
      phone: '+998901234567',
      message: '<script>alert(1)</script>Salom',
    });

    expect(leadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Ulugbek', message: 'Salom' }),
    );
  });

  it('drops an unknown courseId rather than failing a real enquiry', async () => {
    courseRepository.findById.mockResolvedValue(null);

    await useCase.execute({ fullName: 'Ulugbek', phone: '+998901234567', courseId: 'stale-id' });

    expect(leadRepository.create).toHaveBeenCalledWith(expect.objectContaining({ courseId: null }));
  });
});
