import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  notificationConfig,
  seedConfig,
  storageConfig,
  validationSchema,
} from './config';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { NotificationModule } from './notification/notification.module';
import { SecurityModule } from './security/security.module';
import { StorageModule } from './storage/storage.module';

/**
 * Infrastructure wiring shared by every feature module.
 *
 * Global, so a feature module never has to re-import `SecurityModule` or
 * `StorageModule` just to reach a one-per-app service.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, notificationConfig, seedConfig],
      validationSchema,
      validationOptions: {
        // Report every problem at once instead of one boot failure per fix.
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    LoggerModule,
    SecurityModule,
    StorageModule,
    NotificationModule,
    HealthModule,
  ],
  exports: [ConfigModule, SecurityModule, StorageModule, NotificationModule],
})
export class CoreModule {}
