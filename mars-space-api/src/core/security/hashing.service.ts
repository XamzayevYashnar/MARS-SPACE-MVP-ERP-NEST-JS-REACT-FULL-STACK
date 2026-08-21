import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * The only place in the codebase that hashes or verifies a secret.
 *
 * Argon2id with the parameters below is the OWASP-recommended baseline; the
 * options live here rather than at call sites so a future cost bump is a
 * one-line change.
 */
@Injectable()
export class HashingService {
  private readonly logger = new Logger(HashingService.name);

  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  };

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  /**
   * Verifies a secret against its stored hash.
   *
   * A malformed or truncated hash in the database must read as "wrong
   * password", never as a 500 that tells an attacker the record exists.
   */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (error) {
      this.logger.warn(
        `Hash verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }
}
