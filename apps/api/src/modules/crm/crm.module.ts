/**
 * CoreKnot CRM — transitional on Platform API until Mongo sunset.
 * Authoritative write path: api.coreknot.in. Sunset: remove after cutover.
 * @see docs/architecture/COREKNOT-BOUNDARY.md
 */
import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
