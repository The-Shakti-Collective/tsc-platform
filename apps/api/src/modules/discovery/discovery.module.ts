import { Module } from '@nestjs/common';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [IntelligenceModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryRepository],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
