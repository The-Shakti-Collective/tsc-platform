import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { DealModule } from '../deal/deal.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { SyncEmitterModule } from '../sync/sync-emitter.module';
import { MarketplaceController } from './marketplace.controller';
import {
  ArtistApplicationsController,
  OpportunityController,
} from './opportunity.controller';
import { OpportunityRepository } from './opportunity.repository';
import { OpportunityService } from './opportunity.service';
import { OpportunitySyncEmitter } from './opportunity-sync.emitter';

@Module({
  imports: [IntelligenceModule, ActivityModule, CreditsModule, SyncEmitterModule, forwardRef(() => DataExchangeModule), forwardRef(() => DealModule)],
  controllers: [MarketplaceController, OpportunityController, ArtistApplicationsController],
  providers: [OpportunityService, OpportunityRepository, OpportunitySyncEmitter],
  exports: [OpportunityService, OpportunityRepository],
})
export class OpportunityModule {}
