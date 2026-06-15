import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { EventIntelligenceAliasController } from './event-intelligence-alias.controller';
import { EventIntelligenceController } from './event-intelligence.controller';
import { EventIntelligenceRepository } from './event-intelligence.repository';
import { EventIntelligenceService } from './event-intelligence.service';

@Module({
  imports: [EventModule],
  controllers: [EventIntelligenceController, EventIntelligenceAliasController],
  providers: [EventIntelligenceService, EventIntelligenceRepository],
  exports: [EventIntelligenceService],
})
export class EventIntelligenceModule {}
