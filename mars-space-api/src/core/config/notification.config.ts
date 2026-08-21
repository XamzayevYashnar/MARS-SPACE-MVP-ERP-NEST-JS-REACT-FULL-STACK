import { registerAs } from '@nestjs/config';

export interface NotificationConfig {
  telegram: {
    botToken: string;
    chatId: string;
    /** True only when both the token and the chat id are present. */
    enabled: boolean;
  };
}

export const notificationConfig = registerAs<NotificationConfig>('notification', () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
  const chatId = process.env.TELEGRAM_CHAT_ID ?? '';

  return {
    telegram: {
      botToken,
      chatId,
      enabled: botToken.length > 0 && chatId.length > 0,
    },
  };
});
