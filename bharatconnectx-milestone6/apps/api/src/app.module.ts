import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { CustomersModule } from './customers/customers.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RedisModule } from './redis/redis.module';
import { BookingModule } from './booking/booking.module';
import { MarketingModule } from './marketing/marketing.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    BusinessModule,
    CustomersModule,
    CustomFieldsModule,
    BookingModule,
    MarketingModule,
    AnalyticsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
