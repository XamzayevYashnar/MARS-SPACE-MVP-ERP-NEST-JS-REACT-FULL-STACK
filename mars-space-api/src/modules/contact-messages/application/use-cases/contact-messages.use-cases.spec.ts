import { EntityNotFoundException, InvalidPhoneException } from '../../../../common/exceptions';
import { TelegramNotifier } from '../../../../core/notification/telegram.notifier';
import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';
import { CreateContactMessageUseCase } from './create-contact-message.use-case';
import { DeleteContactMessageUseCase } from './delete-contact-message.use-case';
import { GetContactMessageUseCase } from './get-contact-message.use-case';
import { ListContactMessagesUseCase } from './list-contact-messages.use-case';
import { MarkContactMessageReadUseCase } from './mark-contact-message-read.use-case';

function buildMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return new ContactMessage(
    overrides.id ?? 'message-1',
    overrides.fullName ?? 'Hasan Aliyev',
    overrides.email ?? null,
    overrides.phone ?? '+998901234567',
    overrides.subject ?? 'Hamkorlik',
    overrides.message ?? 'Korporativ kurs mumkinmi?',
    overrides.isRead ?? false,
    overrides.createdAt ?? new Date('2026-08-01'),
  );
}

function buildRepository(): jest.Mocked<ContactMessageRepository> {
  return {
    findMany: jest.fn().mockResolvedValue({
      items: [buildMessage()],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    findById: jest.fn().mockResolvedValue(buildMessage()),
    create: jest.fn().mockResolvedValue(buildMessage()),
    markAsRead: jest.fn().mockResolvedValue(buildMessage({ isRead: true })),
    delete: jest.fn().mockResolvedValue(undefined),
    countUnread: jest.fn().mockResolvedValue(2),
  } as unknown as jest.Mocked<ContactMessageRepository>;
}

describe('CreateContactMessageUseCase', () => {
  let repository: jest.Mocked<ContactMessageRepository>;
  let notifier: jest.Mocked<TelegramNotifier>;
  let useCase: CreateContactMessageUseCase;

  beforeEach(() => {
    repository = buildRepository();
    notifier = {
      notifyNewContactMessage: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TelegramNotifier>;
    useCase = new CreateContactMessageUseCase(repository, notifier);
  });

  it('stores the message and notifies the team', async () => {
    const result = await useCase.execute({
      fullName: 'Hasan',
      phone: '90 123 45 67',
      message: 'Savol bor',
    });

    expect(result.accepted).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+998901234567' }),
    );
    expect(notifier.notifyNewContactMessage).toHaveBeenCalledTimes(1);
  });

  it('silently discards a honeypot submission', async () => {
    const result = await useCase.execute({
      fullName: 'Bot',
      phone: '+998901234567',
      message: 'spam',
      website: 'http://spam.example',
    });

    expect(result.accepted).toBe(true);
    expect(repository.create).not.toHaveBeenCalled();
    expect(notifier.notifyNewContactMessage).not.toHaveBeenCalled();
  });

  it('rejects an unusable phone number', async () => {
    await expect(
      useCase.execute({ fullName: 'Hasan', phone: '123', message: 'Savol' }),
    ).rejects.toThrow(InvalidPhoneException);
  });

  it('strips markup from the subject and body', async () => {
    await useCase.execute({
      fullName: 'Hasan',
      phone: '+998901234567',
      subject: '<b>Mavzu</b>',
      message: '<script>alert(1)</script>Matn',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Mavzu', message: 'Matn' }),
    );
  });
});

describe('inbox use cases', () => {
  let repository: jest.Mocked<ContactMessageRepository>;

  beforeEach(() => {
    repository = buildRepository();
  });

  it('lists the inbox with the read filter', async () => {
    await new ListContactMessagesUseCase(repository).execute({ isRead: false });

    expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ isRead: false }));
  });

  it('reads one message', async () => {
    await expect(
      new GetContactMessageUseCase(repository).execute('message-1'),
    ).resolves.toMatchObject({ id: 'message-1' });
  });

  it('404s on an unknown message', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(new GetContactMessageUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('marks a message read', async () => {
    const result = await new MarkContactMessageReadUseCase(repository).execute('message-1', true);

    expect(repository.markAsRead).toHaveBeenCalledWith('message-1', true);
    expect(result.isRead).toBe(true);
  });

  it('404s when marking an unknown message', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new MarkContactMessageReadUseCase(repository).execute('ghost', true),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('deletes a message', async () => {
    await new DeleteContactMessageUseCase(repository).execute('message-1');

    expect(repository.delete).toHaveBeenCalledWith('message-1');
  });

  it('404s when deleting an unknown message', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(new DeleteContactMessageUseCase(repository).execute('ghost')).rejects.toThrow(
      EntityNotFoundException,
    );
  });
});
