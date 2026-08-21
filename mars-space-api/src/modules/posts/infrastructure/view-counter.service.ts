import { Injectable } from '@nestjs/common';
import {
  VIEW_COUNTER_MAX_ENTRIES,
  VIEW_COUNTER_TTL_MS,
} from '../../../common/constants/app.constants';

/**
 * De-duplicates post views: one IP counts at most once per post per hour
 * (§6.4.8).
 *
 * An in-memory LRU is explicitly acceptable for the MVP. It is per-process, so
 * a multi-instance deployment would count a view once per instance — the right
 * trade for a vanity counter, and the reason this lives behind a service that
 * a Redis implementation can replace without touching the use case.
 */
@Injectable()
export class ViewCounterService {
  /** `postId:ip` → timestamp of the view that was counted. */
  private readonly seen = new Map<string, number>();

  /**
   * Returns true when this view should increment the counter, and records it.
   */
  shouldCount(postId: string, ipAddress: string | undefined): boolean {
    // Without an IP there is nothing to de-duplicate on; counting is the
    // behaviour that keeps the number meaningful for genuine traffic.
    if (!ipAddress) {
      return true;
    }

    const key = `${postId}:${ipAddress}`;
    const now = Date.now();
    const lastSeen = this.seen.get(key);

    if (lastSeen !== undefined && now - lastSeen < VIEW_COUNTER_TTL_MS) {
      // Refresh recency without counting, so a returning reader stays hot in
      // the map rather than being evicted and then counted again.
      this.seen.delete(key);
      this.seen.set(key, lastSeen);
      return false;
    }

    this.seen.delete(key);
    this.seen.set(key, now);
    this.evictIfNeeded(now);

    return true;
  }

  private evictIfNeeded(now: number): void {
    if (this.seen.size <= VIEW_COUNTER_MAX_ENTRIES) {
      return;
    }

    // Drop expired entries first; only fall back to plain LRU eviction if the
    // map is still over budget after that.
    for (const [key, timestamp] of this.seen) {
      if (now - timestamp >= VIEW_COUNTER_TTL_MS) {
        this.seen.delete(key);
      }
      if (this.seen.size <= VIEW_COUNTER_MAX_ENTRIES) {
        return;
      }
    }

    // Map iteration order is insertion order, so the first key is the oldest.
    while (this.seen.size > VIEW_COUNTER_MAX_ENTRIES) {
      const oldest = this.seen.keys().next();
      if (oldest.done) {
        return;
      }
      this.seen.delete(oldest.value);
    }
  }
}
