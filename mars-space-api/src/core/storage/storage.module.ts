import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from '../config/storage.config';
import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';
import { StorageService } from './storage.service';

/**
 * Binds the `StorageService` port to the driver named by `STORAGE_DRIVER`.
 * Consumers inject the abstract class and never learn which driver won.
 */
@Module({
  providers: [
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StorageService => {
        const { driver } = configService.getOrThrow<StorageConfig>('storage');
        return driver === 's3'
          ? new S3StorageService(configService)
          : new LocalStorageService(configService);
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
