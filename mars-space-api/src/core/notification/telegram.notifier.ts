import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationConfig } from '../config/notification.config';

export interface NewLeadNotification {
  id: string;
  fullName: string;
  phone: string;
  courseTitle?: string | null;
  message?: string | null;
  source: string;
  pageUrl?: string | null;
  utmSource?: string | null;
  createdAt: Date;
}

export interface NewContactMessageNotification {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  createdAt: Date;
}

const TELEGRAM_TIMEOUT_MS = 5_000;

/**
 * Sends sales alerts to a Telegram chat.
 *
 * Notification is a side effect of lead capture, never a precondition: every
 * failure path here logs and resolves, so a missing token or a Telegram outage
 * can never turn a captured lead into a failed request (§13).
 */
@Injectable()
export class TelegramNotifier {
  private readonly logger = new Logger(TelegramNotifier.name);
  private readonly config: NotificationConfig['telegram'];

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<NotificationConfig>('notification').telegram;

    if (!this.config.enabled) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set — new-lead alerts will be logged only',
      );
    }
  }

  async notifyNewLead(lead: NewLeadNotification): Promise<void> {
    await this.send(this.formatLead(lead), `lead ${lead.id}`);
  }

  async notifyNewContactMessage(message: NewContactMessageNotification): Promise<void> {
    await this.send(this.formatContactMessage(message), `contact message ${message.id}`);
  }

  private formatLead(lead: NewLeadNotification): string {
    const lines = [
      '<b>🚀 Yangi lead — Mars Space</b>',
      '',
      `<b>Ism:</b> ${escapeHtml(lead.fullName)}`,
      `<b>Telefon:</b> ${escapeHtml(lead.phone)}`,
    ];

    if (lead.courseTitle) {
      lines.push(`<b>Kurs:</b> ${escapeHtml(lead.courseTitle)}`);
    }
    if (lead.message) {
      lines.push(`<b>Xabar:</b> ${escapeHtml(lead.message)}`);
    }

    lines.push(`<b>Manba:</b> ${escapeHtml(lead.source)}`);

    if (lead.utmSource) {
      lines.push(`<b>UTM:</b> ${escapeHtml(lead.utmSource)}`);
    }
    if (lead.pageUrl) {
      lines.push(`<b>Sahifa:</b> ${escapeHtml(lead.pageUrl)}`);
    }

    lines.push('', `<i>${lead.createdAt.toISOString()}</i>`);

    return lines.join('\n');
  }

  private formatContactMessage(message: NewContactMessageNotification): string {
    const lines = [
      '<b>✉️ Yangi murojaat — Mars Space</b>',
      '',
      `<b>Ism:</b> ${escapeHtml(message.fullName)}`,
      `<b>Telefon:</b> ${escapeHtml(message.phone)}`,
    ];

    if (message.email) {
      lines.push(`<b>Email:</b> ${escapeHtml(message.email)}`);
    }
    if (message.subject) {
      lines.push(`<b>Mavzu:</b> ${escapeHtml(message.subject)}`);
    }

    lines.push('', escapeHtml(message.message), '', `<i>${message.createdAt.toISOString()}</i>`);

    return lines.join('\n');
  }

  private async send(text: string, subject: string): Promise<void> {
    if (!this.config.enabled) {
      this.logger.log(`Telegram disabled; would have sent alert for ${subject}`);
      return;
    }

    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(
          `Telegram rejected the alert for ${subject}: ${response.status} ${response.statusText}`,
        );
        return;
      }

      this.logger.log(`Telegram alert sent for ${subject}`);
    } catch (error) {
      this.logger.error(
        `Telegram alert for ${subject} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}

/** Telegram's HTML parse mode only needs these three characters escaped. */
function escapeHtml(input: string): string {
  return input.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
}
