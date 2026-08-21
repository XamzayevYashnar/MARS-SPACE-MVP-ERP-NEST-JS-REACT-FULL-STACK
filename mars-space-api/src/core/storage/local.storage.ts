import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { StorageConfig } from '../config/storage.config';
import { FileToStore, StorageService, StoredFile } from './storage.service';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

/**
 * Disk-backed storage used in development and by the Docker image.
 *
 * Filenames are regenerated from a UUID and the extension is derived from the
 * verified MIME type, never from `originalName` (§7) — that is what keeps a
 * crafted upload name from escaping the uploads directory or landing as `.html`.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly config: StorageConfig;
  private readonly rootDir: string;

  constructor(configService: ConfigService) {
    super();
    this.config = configService.getOrThrow<StorageConfig>('storage');
    this.rootDir = resolve(process.cwd(), this.config.localPath);
  }

  async store(file: FileToStore): Promise<StoredFile> {
    const key = this.buildKey(file.mimeType);
    const absolutePath = join(this.rootDir, key);

    await mkdir(resolve(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      key,
      url: this.urlFor(key),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.byteLength,
    };
  }

  async remove(key: string): Promise<void> {
    const absolutePath = this.safeResolve(key);
    if (!absolutePath) {
      this.logger.warn(`Refused to delete a key that escapes the storage root: ${key}`);
      return;
    }

    try {
      await unlink(absolutePath);
    } catch (error) {
      // A file that is already gone is the desired end state, not a failure.
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`File ${key} was already absent from disk`);
    }
  }

  urlFor(key: string): string {
    return `${this.config.publicUrl}/${key.split('\\').join('/')}`;
  }

  /** `2026/08/<uuid>.<ext>` — month folders keep directory listings usable. */
  private buildKey(mimeType: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const extension = MIME_EXTENSION[mimeType] ?? '.bin';

    return `${year}/${month}/${randomUUID()}${extension}`;
  }

  /** Returns the absolute path only when it stays inside the storage root. */
  private safeResolve(key: string): string | null {
    const candidate = resolve(this.rootDir, key);
    const withinRoot = candidate === this.rootDir || candidate.startsWith(this.rootDir + sep);
    if (!withinRoot) {
      return null;
    }
    // Reject anything that would resolve to a directory rather than a file.
    return extname(candidate).length > 0 ? candidate : null;
  }
}
