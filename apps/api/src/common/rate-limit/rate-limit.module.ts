import { Global, Module } from '@nestjs/common';
import { IpRateLimitGuard } from './ip-rate-limit.guard';
import { IpRateLimitService } from './ip-rate-limit.service';

@Global()
@Module({
  providers: [IpRateLimitService, IpRateLimitGuard],
  exports: [IpRateLimitService, IpRateLimitGuard],
})
export class RateLimitModule {}
