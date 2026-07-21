import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RollupService } from './rollup.service';

@Injectable()
export class RollupScheduler {
  private readonly logger = new Logger(RollupScheduler.name);

  constructor(private readonly rollupService: RollupService) {}

  // 00:30 server time, every day — gives the previous day's data a
  // 30-minute buffer to fully settle (e.g. a campaign job still
  // finishing up close to midnight) before rolling it up.
  @Cron('30 0 * * *')
  async handleNightlyRollup() {
    this.logger.log('Running nightly analytics rollup…');
    try {
      await this.rollupService.runForYesterday();
    } catch (e) {
      this.logger.error(`Nightly rollup failed: ${(e as Error).message}`);
    }
  }
}
