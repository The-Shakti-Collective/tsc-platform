import { Global, Module } from '@nestjs/common';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { BetterstackHeartbeatService } from './betterstack-heartbeat.service';
import { ObservabilityInitService } from './observability-init.service';

@Global()
@Module({
  imports: [AnalyticsModule],
  providers: [BetterstackHeartbeatService, ObservabilityInitService],
})
export class ObservabilityModule {}
