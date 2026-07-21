import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export interface CampaignJobData {
  campaignId: string;
}

/**
 * Spec section 2 puts BullMQ next to Redis specifically for "campaign
 * send queue" — sending to a whole segment can be thousands of
 * messages, which must never happen inline on the POST /campaigns
 * request. This queues one job per campaign; CampaignProcessor (the
 * worker) does the actual per-customer sending in the background.
 *
 * BullMQ requires its own connection options (maxRetriesPerRequest:
 * null) — it manages retries/blocking itself, so it can't share the
 * same ioredis instance RedisService/RedisLockService use.
 */
@Injectable()
export class CampaignQueueService implements OnModuleDestroy {
  readonly queue: Queue<CampaignJobData>;

  constructor(config: ConfigService) {
    this.queue = new Queue<CampaignJobData>('campaign-send', {
      connection: {
        // ioredis connection options — BullMQ builds its own client
        // from these, using the same REDIS_URL as the rest of the app.
        ...parseRedisUrl(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'),
        maxRetriesPerRequest: null,
      },
    });
  }

  async enqueue(campaignId: string, delayMs = 0) {
    return this.queue.add(
      'send',
      { campaignId },
      { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}

function parseRedisUrl(url: string) {
  const u = new URL(url);
  return { host: u.hostname, port: Number(u.port || 6379), password: u.password || undefined };
}
