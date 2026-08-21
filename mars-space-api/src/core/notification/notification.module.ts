import { Module } from '@nestjs/common';
import { TelegramNotifier } from './telegram.notifier';

@Module({
  providers: [TelegramNotifier],
  exports: [TelegramNotifier],
})
export class NotificationModule {}
