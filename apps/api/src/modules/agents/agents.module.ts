import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AudienceModule } from '../audience/audience.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { EventIntelligenceModule } from '../event-intelligence/event-intelligence.module';
import { EventModule } from '../event/event.module';
import { TrustModule } from '../trust/trust.module';
import {
  AgentsController,
  BrandMatchAgentController,
  CareerAgentController,
  CommunityAgentController,
  EventAgentController,
  OpportunityAgentController,
  TalentDiscoveryAgentController,
  ForecastAgentController,
  CopilotAgentController,
  InsightsController,
  AutonomousWorkflowController,
  OpportunityGenerationController,
} from './agents.controller';
import { AgentsRepository } from './agents.repository';
import { BrandMatchAgentService } from './brand-match-agent.service';
import { CareerAgentService } from './career-agent.service';
import { CommunityAgentService } from './community-agent.service';
import { DecisionEngineService } from './decision-engine.service';
import { EventAgentService } from './event-agent.service';
import { OpportunityAgentService } from './opportunity-agent.service';
import { TalentDiscoveryAgentService } from './talent-discovery-agent.service';
import { ForecastAgentService } from './forecast-agent.service';
import { ForecastRepository } from './forecast.repository';
import { CopilotAgentService } from './copilot-agent.service';
import { AutonomousWorkflowService } from './autonomous-workflow.service';
import { AutonomousWorkflowRepository } from './autonomous-workflow.repository';
import { OpportunityGenerationRepository } from './opportunity-generation.repository';
import { OpportunityGenerationService } from './opportunity-generation.service';

@Module({
  imports: [ActivityModule, AudienceModule, CollaborationModule, EventIntelligenceModule, EventModule, TrustModule],
  controllers: [
    AgentsController,
    OpportunityAgentController,
    CareerAgentController,
    CommunityAgentController,
    EventAgentController,
    BrandMatchAgentController,
    TalentDiscoveryAgentController,
    ForecastAgentController,
    CopilotAgentController,
    InsightsController,
    AutonomousWorkflowController,
    OpportunityGenerationController,
  ],
  providers: [
    AgentsRepository,
    ForecastRepository,
    DecisionEngineService,
    OpportunityAgentService,
    OpportunityGenerationRepository,
    OpportunityGenerationService,
    CareerAgentService,
    CommunityAgentService,
    EventAgentService,
    BrandMatchAgentService,
    TalentDiscoveryAgentService,
    ForecastAgentService,
    CopilotAgentService,
    AutonomousWorkflowRepository,
    AutonomousWorkflowService,
  ],
  exports: [
    DecisionEngineService,
    OpportunityAgentService,
    CareerAgentService,
    CommunityAgentService,
    EventAgentService,
    BrandMatchAgentService,
    TalentDiscoveryAgentService,
    ForecastAgentService,
    CopilotAgentService,
    AutonomousWorkflowService,
    OpportunityGenerationService,
  ],
})
export class AgentsModule {}
