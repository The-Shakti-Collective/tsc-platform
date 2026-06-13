import { Module } from '@nestjs/common';
import { RecommendationsV2Controller, TrustController } from './trust.controller';
import { TrustRepository } from './trust.repository';
import { TrustService } from './trust.service';

@Module({
  controllers: [TrustController, RecommendationsV2Controller],
  providers: [TrustService, TrustRepository],
  exports: [TrustService],
})
export class TrustModule {}
