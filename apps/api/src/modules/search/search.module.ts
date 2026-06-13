import { Module } from '@nestjs/common';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { MarketplaceController } from './marketplace.controller';

@Module({
  imports: [OpportunityModule],
  controllers: [MarketplaceController],
})
export class SearchModule {}
