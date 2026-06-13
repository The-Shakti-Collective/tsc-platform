import { Module, forwardRef } from '@nestjs/common';
import { PublicApiModule } from '../public-api/public-api.module';
import { RelationshipModule } from '../relationship/relationship.module';
import { AdminWebhookController } from './admin-webhook.controller';
import {
  DataExportService,
  ExchangePartnerService,
  GraphExportService,
} from './data-export.service';
import { ExchangePartnerController } from './exchange-partner.controller';
import {
  PublicExportController,
  PublicGraphExportController,
} from './public-export.controller';
import { WebhookEmitterService } from './webhook-emitter.service';
import { ExchangePartnerRepository, WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

@Module({
  imports: [forwardRef(() => PublicApiModule), forwardRef(() => RelationshipModule)],
  controllers: [
    AdminWebhookController,
    PublicExportController,
    PublicGraphExportController,
    ExchangePartnerController,
  ],
  providers: [
    WebhookRepository,
    ExchangePartnerRepository,
    WebhookService,
    WebhookEmitterService,
    DataExportService,
    GraphExportService,
    ExchangePartnerService,
  ],
  exports: [WebhookEmitterService, WebhookService, ExchangePartnerService],
})
export class DataExchangeModule {}
