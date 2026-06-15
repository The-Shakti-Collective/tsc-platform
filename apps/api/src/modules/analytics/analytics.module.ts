import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsDomainService, AnalyticsRepository } from './analytics-domain.service';
import { PosthogService } from './posthog.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [PosthogService, AnalyticsRepository, AnalyticsDomainService],
  exports: [PosthogService, AnalyticsDomainService],
})
export class AnalyticsModule {}
