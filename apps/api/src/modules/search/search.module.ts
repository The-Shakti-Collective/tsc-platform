import { Module } from '@nestjs/common';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { MarketplaceController } from './marketplace.controller';
import { SearchController } from './search.controller';
import { TypesenseService } from './typesense.service';

@Module({
  imports: [OpportunityModule],
  controllers: [MarketplaceController, SearchController],
  providers: [TypesenseService],
  exports: [TypesenseService],
})
export class SearchModule {}
