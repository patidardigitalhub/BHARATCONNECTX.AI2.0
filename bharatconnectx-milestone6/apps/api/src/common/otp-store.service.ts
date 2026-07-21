import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

/**
 * MVP in-memory OTP store, keyed by phone number.
 *
 * Spec note (section 2 — Tech Stack): production should back this with
 * Redis (already in the stack for webhook dedup / slot locks) so OTPs
 * survive an API restart and work across multiple instances. This
 * in-memory version is enough to build and test Milestone 1 end-to-end;
 * swap the two methods below for redis.set/get with a TTL when Redis
 * is wired up.
 */
@Injectable()
export class OtpStoreService {
  private readonly store = new Map<string, OtpEntry>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 5;

  generate(phone: string): string {
    const code = crypto.randomInt(100000, 999999).toString();
    this.store.set(phone, { code, expiresAt: Date.now() + this.TTL_MS, attempts: 0 });
    return code;
  }

  verify(phone: string, code: string): { valid: boolean; reason?: string } {
    const entry = this.store.get(phone);
    if (!entry) return { valid: false, reason: 'No OTP requested for this number' };
    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      return { valid: false, reason: 'OTP expired' };
    }
    if (entry.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(phone);
      return { valid: false, reason: 'Too many attempts — request a new OTP' };
    }
    entry.attempts += 1;
    if (entry.code !== code) return { valid: false, reason: 'Incorrect OTP' };

    this.store.delete(phone);
    return { valid: true };
  }
}
