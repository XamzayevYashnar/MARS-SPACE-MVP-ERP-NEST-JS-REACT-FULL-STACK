import { registerAs } from '@nestjs/config';

export type StorageDriver = 'local' | 's3';

export interface StorageConfig {
  driver: StorageDriver;
  localPath: string;
  publicUrl: string;
  maxFileSize: number;
  s3: {
    endpoint: string;
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
  };
}

export const storageConfig = registerAs<StorageConfig>('storage', () => ({
  driver: (process.env.STORAGE_DRIVER ?? 'local') as StorageDriver,
  localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
  publicUrl: (process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:4000/uploads').replace(
    /\/+$/,
    '',
  ),
  maxFileSize: Number(process.env.STORAGE_MAX_FILE_SIZE ?? 5 * 1024 * 1024),
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '',
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? '',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
  },
}));
