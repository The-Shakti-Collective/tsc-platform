import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

import { AuthModule } from './common/auth/auth.module';
import { PrismaModule } from './common/database/prisma.module';

import { HealthModule } from './modules/health/health.module';

import { QueuesModule } from './queues/queues.module';
import { ObservabilityModule } from './observability/observability.module';

import { ActivityModule } from './modules/activity/activity.module';

import { AnalyticsModule } from './modules/analytics/analytics.module';

import { ArtistModule } from './modules/artist/artist.module';

import { BookingModule } from './modules/booking/booking.module';

import { ContractModule } from './modules/contract/contract.module';

import { PaymentModule } from './modules/payment/payment.module';

import { CityModule } from './modules/city/city.module';

import { CollaborationModule } from './modules/collaboration/collaboration.module';

import { CreditsModule } from './modules/credits/credits.module';

import { CommunityModule } from './modules/community/community.module';

import { DirectoryModule } from './modules/directory/directory.module';

import { DiscoveryModule } from './modules/discovery/discovery.module';

import { EventModule } from './modules/event/event.module';

import { EventIntelligenceModule } from './modules/event-intelligence/event-intelligence.module';

import { FeedModule } from './modules/feed/feed.module';

import { FinanceModule } from './modules/finance/finance.module';

import { GraphModule } from './modules/graph/graph.module';

import { IdentityModule } from './modules/identity/identity.module';

import { IndustryModule } from './modules/industry/industry.module';

import { IntelligenceModule } from './modules/intelligence/intelligence.module';

import { MembershipModule } from './modules/membership/membership.module';

import { NotificationModule } from './modules/notification/notification.module';

import { OpportunityModule } from './modules/opportunity/opportunity.module';

import { PassportModule } from './modules/passport/passport.module';

import { PostModule } from './modules/post/post.module';

import { ProfileModule } from './modules/profile/profile.module';

import { RelationshipModule } from './modules/relationship/relationship.module';

import { ReputationModule } from './modules/reputation/reputation.module';

import { DealModule } from './modules/deal/deal.module';

import { TrustModule } from './modules/trust/trust.module';

import { RewardsModule } from './modules/rewards/rewards.module';

import { SearchModule } from './modules/search/search.module';

import { SyncModule } from './modules/sync/sync.module';

import { FanModule } from './modules/fan/fan.module';

import { AudienceModule } from './modules/audience/audience.module';

import { SupportModule } from './modules/support/support.module';

import { CommerceModule } from './modules/commerce/commerce.module';

import { AudienceOsModule } from './modules/audience-os/audience-os.module';

import { AgentsModule } from './modules/agents/agents.module';

import { TscIdentityModule } from './modules/tsc-identity/tsc-identity.module';

import { PublicApiModule } from './modules/public-api/public-api.module';

import { WhiteLabelModule } from './modules/white-label/white-label.module';

import { DataExchangeModule } from './modules/data-exchange/data-exchange.module';

import { CreativeIdentityModule } from './modules/creative-identity/creative-identity.module';

import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';

const sentryProviders = process.env.SENTRY_DSN
  ? [{ provide: APP_FILTER, useClass: SentryGlobalFilter }]
  : [];

@Module({

  imports: [

    PrismaModule,

    AuthModule,

    HealthModule,

    QueuesModule,

    ObservabilityModule,

    IdentityModule,

    ArtistModule,

    CommunityModule,

    EventModule,

    EventIntelligenceModule,

    FeedModule,

    PostModule,

    NotificationModule,

    MembershipModule,

    GraphModule,

    OpportunityModule,

    PassportModule,

    ProfileModule,

    ActivityModule,

    FinanceModule,

    AnalyticsModule,

    IndustryModule,

    DealModule,

    TrustModule,

    IntelligenceModule,

    RelationshipModule,

    CollaborationModule,

    ReputationModule,

    CreditsModule,

    DirectoryModule,

    DiscoveryModule,

    CityModule,

    BookingModule,

    ContractModule,

    PaymentModule,

    SearchModule,

    SyncModule,

    FanModule,

    RewardsModule,

    AudienceModule,

    SupportModule,

    CommerceModule,

    AudienceOsModule,

    AgentsModule,

    TscIdentityModule,

    PublicApiModule,

    WhiteLabelModule,

    DataExchangeModule,

    CreativeIdentityModule,

    WorkspaceModule,

    ProjectModule,

    TaskModule,

  ],

  providers: [...sentryProviders],

})

export class AppModule {}

