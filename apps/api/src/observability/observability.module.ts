import { Global, Module } from '@nestjs/common';
import { BetterstackHeartbeatService } from './betterstack-heartbeat.service';

@Global()
@Module({
  providers: [BetterstackHeartbeatService],
})
export class ObservabilityModule {}
