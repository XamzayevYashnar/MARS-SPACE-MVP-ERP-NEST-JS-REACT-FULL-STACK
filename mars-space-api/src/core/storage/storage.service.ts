/** Everything a caller needs to know about a file that was just stored. */
export interface StoredFile {
  /** Driver-relative key: the path on disk, or the S3 object key. */
  key: string;
  /** Publicly reachable URL. */
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface FileToStore {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

/**
 * Port for file persistence, implemented by `LocalStorageService` and
 * `S3StorageService`.
 *
 * It is an abstract class rather than an interface so it doubles as the DI
 * token, matching the repository-port pattern used by every module (§3).
 */
export abstract class StorageService {
  abstract store(file: FileToStore): Promise<StoredFile>;
  abstract remove(key: string): Promise<void>;
  abstract urlFor(key: string): string;
}
