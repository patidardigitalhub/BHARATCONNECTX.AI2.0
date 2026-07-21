import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RollupService } from './rollup.service';
import { RollupScheduler } from './rollup.scheduler';

@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RollupService, RollupScheduler],
})
export class AnalyticsModule {}
