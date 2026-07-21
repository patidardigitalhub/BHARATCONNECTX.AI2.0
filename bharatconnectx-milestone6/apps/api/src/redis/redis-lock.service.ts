import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from './redis.service';

/**
 * Spec section 4.2: "slots.is_locked — Redis lock during confirmation".
 *
 * Two customers hitting "book this slot" at the same instant is the
 * exact race this exists to close: without a lock, both requests could
 * pass a "is this slot free?" check before either one commits the
 * appointment row, double-booking the slot.
 *
 * Uses the standard SET key value NX PX ttl pattern — NX means only
 * the first caller gets the key, everyone else is told the slot is
 * busy immediately. Release is token-checked (via a Lua script) so a
 * request can only unlock the slot it itself locked, never one another
 * request holds — this matters once locks can also expire on their own.
 */
@Injectable()
export class RedisLockService {
  constructor(private readonly redis: RedisService) {}

  private readonly RELEASE_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  async acquire(slotId: string, ttlMs = 15_000): Promise<string | null> {
    const token = randomUUID();
    const key = this.lockKey(slotId);
    const result = await this.redis.client.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  async release(slotId: string, token: string): Promise<boolean> {
    const key = this.lockKey(slotId);
    const result = await this.redis.client.eval(this.RELEASE_SCRIPT, 1, key, token);
    return result === 1;
  }

  private lockKey(slotId: string): string {
    return `slot-lock:${slotId}`;
  }
}
