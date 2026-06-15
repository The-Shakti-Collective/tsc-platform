import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AgentsModule } from '../agents/agents.module';
import { AudienceModule } from '../audience/audience.module';
import { IntelligenceActionsController } from './actions.controller';
import { AutomationV2AliasController } from './automation-v2-alias.controller';
import { AutomationController } from './automation.controller';
import { AutomationEngineV2Repository } from './automation-engine-v2.repository';
import { AutomationEngineV2Service } from './automation-engine-v2.service';
import { AutomationService } from './automation.service';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { CommandCenterV3Repository } from './command-center-v3.repository';
import { CommandCenterV4Repository } from './command-center-v4.repository';
import { IntelligenceAnalyticsRepository } from './intelligence-analytics.repository';
import { ParticipationAnalyticsRepository } from './participation-analytics.repository';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { AutomationRepository, GoalRepository } from './automation.repository';

@Module({
  imports: [AudienceModule, AgentsModule, ActivityModule],
  controllers: [
    IntelligenceController,
    IntelligenceActionsController,
    AutomationController,
    AutomationV2AliasController,
    GoalController,
  ],
  providers: [
    IntelligenceService,
    IntelligenceAnalyticsRepository,
    CommandCenterV3Repository,
    CommandCenterV4Repository,
    ParticipationAnalyticsRepository,
    AutomationService,
    AutomationEngineV2Service,
    AutomationEngineV2Repository,
    GoalService,
    AutomationRepository,
    GoalRepository,
  ],
  exports: [IntelligenceService, AutomationService, AutomationEngineV2Service, GoalService],
})
export class IntelligenceModule {}
