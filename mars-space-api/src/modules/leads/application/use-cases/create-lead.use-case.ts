import { Injectable, Logger } from '@nestjs/common';
import { LeadSource } from '@prisma/client';
import { InvalidPhoneException } from '../../../../common/exceptions';
import { pickLanguage } from '../../../../common/utils/localized-text.util';
import { normalizePhone } from '../../../../common/utils/phone.util';
import { stripHtml } from '../../../../common/utils/sanitize-html.util';
import { TelegramNotifier } from '../../../../core/notification/telegram.notifier';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { CreateLeadDto, LeadAcceptedDto } from '../dto/lead.dto';

const ACCEPTED_MESSAGE = 'Arizangiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.';

@Injectable()
export class CreateLeadUseCase {
  private readonly logger = new Logger(CreateLeadUseCase.name);

  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly courseRepository: CourseRepository,
    private readonly telegramNotifier: TelegramNotifier,
  ) {}

  /**
   * Public lead capture (§6.3).
   *
   * The response is deliberately uniform — a plain acknowledgement with no id —
   * so the endpoint cannot be used to enumerate anything, and so a bot caught by
   * the honeypot sees exactly what a human sees.
   */
  async execute(dto: CreateLeadDto): Promise<LeadAcceptedDto> {
    // A filled honeypot means an automated submission: accept it silently so
    // the bot has no signal to adapt to, but store nothing.
    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn('Lead submission rejected by the honeypot field');
      return { accepted: true, message: ACCEPTED_MESSAGE };
    }

    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new InvalidPhoneException();
    }

    // An unknown course id is dropped rather than rejected: a stale link must
    // never cost a real enquiry.
    const course = dto.courseId ? await this.courseRepository.findById(dto.courseId) : null;

    const lead = await this.leadRepository.create({
      fullName: stripHtml(dto.fullName).slice(0, 120),
      phone,
      courseId: course?.id ?? null,
      message: dto.message ? stripHtml(dto.message).slice(0, 2000) : null,
      source: dto.source ?? LeadSource.WEBSITE_FORM,
      utmSource: dto.utmSource ?? null,
      utmMedium: dto.utmMedium ?? null,
      utmCampaign: dto.utmCampaign ?? null,
      pageUrl: dto.pageUrl ?? null,
    });

    // Notification is a side effect; the lead is already persisted, so it is
    // dispatched without blocking the response. Awaiting it made a visitor on
    // the landing page wait out Telegram's latency — up to the notifier's 5 s
    // timeout — before the form reported success (§13).
    void this.telegramNotifier
      .notifyNewLead({
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        courseTitle: course ? pickLanguage(course.title) : null,
        message: lead.message,
        source: lead.source,
        pageUrl: lead.pageUrl,
        utmSource: lead.utmSource,
        createdAt: lead.createdAt,
      })
      // The notifier swallows its own failures; this is belt-and-braces so a
      // future change there can never surface as an unhandled rejection.
      .catch((error: unknown) => {
        this.logger.error(
          `Telegram alert for lead ${lead.id} failed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });

    return { accepted: true, message: ACCEPTED_MESSAGE };
  }
}
