import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { StorageConfig } from '../config/storage.config';
import { FileToStore, StorageService, StoredFile } from './storage.service';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

/**
 * S3-compatible adapter.
 *
 * The MVP ships the `local` driver (§2 lists S3 as an *adapter interface*), so
 * this class implements the port and computes object keys and URLs, but the
 * network calls are left as the single integration point to fill in when a
 * bucket is provisioned. Selecting `STORAGE_DRIVER=s3` therefore fails loudly
 * at the call site rather than silently dropping uploads.
 */
@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly config: StorageConfig;

  constructor(configService: ConfigService) {
    super();
    this.config = configService.getOrThrow<StorageConfig>('storage');
    this.logger.warn(
      'S3 storage driver selected — object transfer is not wired up in this MVP build',
    );
  }

  async store(_file: FileToStore): Promise<StoredFile> {
    throw new ServiceUnavailableException(
      'The S3 storage driver is not enabled in this build. Set STORAGE_DRIVER=local.',
    );
  }

  async remove(_key: string): Promise<void> {
    throw new ServiceUnavailableException(
      'The S3 storage driver is not enabled in this build. Set STORAGE_DRIVER=local.',
    );
  }

  urlFor(key: string): string {
    const base = this.config.s3.endpoint.replace(/\/+$/, '');
    return `${base}/${this.config.s3.bucket}/${key}`;
  }

  /** Kept alongside the port so both drivers derive identical keys. */
  protected buildKey(mimeType: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const extension = MIME_EXTENSION[mimeType] ?? '.bin';

    return `${year}/${month}/${randomUUID()}${extension}`;
  }
}
