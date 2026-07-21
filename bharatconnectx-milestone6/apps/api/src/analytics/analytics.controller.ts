import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsISO8601 } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { RollupService } from './rollup.service';
import { AnalyticsOverviewQueryDto } from './dto/analytics-overview.dto';

class RunRollupDto {
  @IsOptional()
  @IsISO8601()
  date?: string; // defaults to yesterday
}

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly rollupService: RollupService,
  ) {}

  @Get('overview')
  getOverview(@CurrentUser() user: AuthUser, @Query() query: AnalyticsOverviewQueryDto) {
    return this.analyticsService.getOverview(user.businessId, query.days ?? 30);
  }

  // Not in the spec's endpoint tables — the nightly cron
  // (rollup.scheduler.ts) is the real trigger. This exists so the
  // rollup can be exercised on demand instead of waiting for 00:30,
  // e.g. right after seeding test data.
  @Post('rollup/run')
  async runRollup(@Body() dto: RunRollupDto) {
    const date = dto.date ? new Date(dto.date) : (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 1);
      return d;
    })();
    await this.rollupService.runForDate(date);
    return { message: `Rollup run for ${date.toISOString().slice(0, 10)}` };
  }
}
