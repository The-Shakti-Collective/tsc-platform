import { lazy } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import WorkspaceLayout from './components/workspace/WorkspaceLayout';
import { WhiteLabelShell } from './components/white-label/WhiteLabelShell';

const WorkspaceDashboardPage = lazy(() => import('./pages/workspace/WorkspaceDashboardPage'));
const WorkspaceSettingsPage = lazy(() => import('./pages/workspace/WorkspaceSettingsPage'));
const TeamListPage = lazy(() => import('./pages/workspace/TeamListPage'));
const ProjectListPage = lazy(() => import('./pages/workspace/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./pages/workspace/ProjectDetailPage'));
const TaskBoardPage = lazy(() => import('./pages/workspace/TaskBoardPage'));

const CreativeIdentityPage = lazy(() => import('./pages/creative-identity/CreativeIdentityPage'));
const CreativeIdentityEditPage = lazy(() => import('./pages/creative-identity/CreativeIdentityEditPage'));
const SkillDiscoveryPage = lazy(() => import('./pages/creative-identity/SkillDiscoveryPage'));

const EcosystemPassportPage = lazy(() => import('./pages/passport/EcosystemPassportPage'));

const PaymentsDashboardPage = lazy(() => import('./pages/payments/PaymentsDashboardPage'));
const ContractListPage = lazy(() => import('./pages/contract/ContractListPage'));
const BookingInquiryPage = lazy(() => import('./pages/booking/BookingInquiryPage'));

const DealPipelinePage = lazy(() => import('./pages/deal/DealPipelinePage'));
const DealDetailPage = lazy(() => import('./pages/deal/DealDetailPage'));

const BrandListPage = lazy(() => import('./pages/brand/BrandListPage'));
const BrandDetailPage = lazy(() => import('./pages/brand/BrandDetailPage'));

const CollaborationMarketplacePage = lazy(() => import('./pages/collaboration/CollaborationMarketplacePage'));
const PostCollaborationPage = lazy(() => import('./pages/collaboration/PostCollaborationPage'));
const MyCollaborationsPage = lazy(() => import('./pages/collaboration/MyCollaborationsPage'));
const MyCollaborationApplicationsPage = lazy(
  () => import('./pages/collaboration/MyCollaborationApplicationsPage'),
);
const CollaborationDetailPage = lazy(() => import('./pages/collaboration/CollaborationDetailPage'));

const ActivityFeedPage = lazy(() => import('./pages/feed/ActivityFeedPage'));

const ExecutiveCommandCenterPage = lazy(
  () => import('./pages/operating/ExecutiveCommandCenterPage'),
);
const OpportunityGenerationQueuePage = lazy(
  () => import('./pages/operating/OpportunityGenerationQueuePage'),
);
const TalentDiscoveryPage = lazy(() => import('./pages/operating/TalentDiscoveryPage'));
const CommunityDashboardPage = lazy(
  () => import('./pages/operating/communities/CommunityDashboardPage'),
);
const CommunityLeaderPortal = lazy(
  () => import('./pages/operating/communities/CommunityLeaderPortal'),
);
const OpportunityMarketplacePage = lazy(
  () => import('./pages/operating/opportunities/OpportunityMarketplacePage'),
);
const OpportunityDetailPage = lazy(
  () => import('./pages/operating/opportunities/OpportunityDetailPage'),
);
const ArtistWorkspacePage = lazy(() => import('./pages/operating/artists/ArtistWorkspacePage'));

const CareerOSPage = lazy(() => import('./pages/career/CareerOSPage'));
const ArtistAudienceOSPage = lazy(() => import('./pages/audience-os/ArtistAudienceOSPage'));
const CommunityAudienceOSPage = lazy(() => import('./pages/audience-os/CommunityAudienceOSPage'));

const CopilotPage = lazy(() => import('./pages/copilot/CopilotPage'));
const FanCommerceBrowsePage = lazy(() => import('./pages/commerce/FanCommerceBrowsePage'));
const SupportHistoryPage = lazy(() => import('./pages/support/SupportHistoryPage'));
const RewardsCatalogPage = lazy(() => import('./pages/rewards/RewardsCatalogPage'));
const MyRedemptionsPage = lazy(() => import('./pages/rewards/MyRedemptionsPage'));

const TenantHomePage = lazy(() => import('./pages/white-label/TenantHomePage'));
const TenantArtistsPage = lazy(() => import('./pages/white-label/TenantArtistsPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));

function TenantShell() {
  const { tenantSlug } = useParams();
  return (
    <WhiteLabelShell tenantSlug={tenantSlug}>
      <Outlet />
    </WhiteLabelShell>
  );
}

function withAuth(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export const appRoutes = [
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/profile/:slug', element: <EcosystemPassportPage /> },
  { path: '/passport/:slug', element: <EcosystemPassportPage /> },
  { path: '/a/:slug', element: <EcosystemPassportPage /> },
  { path: '/c/:slug', element: <EcosystemPassportPage /> },
  { path: '/b/:slug', element: <EcosystemPassportPage /> },
  { path: '/f/:slug', element: <EcosystemPassportPage /> },
  { path: '/creator/:slug', element: <CreativeIdentityPage /> },
  { path: '/creative/:slug', element: <CreativeIdentityPage /> },
  { path: '/discover/skills', element: <SkillDiscoveryPage /> },
  {
    path: '/t/:tenantSlug',
    element: <TenantShell />,
    children: [
      { index: true, element: <TenantHomePage /> },
      { path: 'artists', element: <TenantArtistsPage /> },
    ],
  },
  {
    path: '/workspace',
    element: withAuth(<WorkspaceLayout />),
    children: [
      { index: true, element: <WorkspaceDashboardPage /> },
      { path: ':slug', element: <WorkspaceDashboardPage /> },
      { path: ':slug/settings', element: <WorkspaceSettingsPage /> },
      { path: ':slug/teams', element: <TeamListPage /> },
      { path: ':slug/projects', element: <ProjectListPage /> },
      { path: ':slug/projects/:projectSlug', element: <ProjectDetailPage /> },
      { path: ':slug/tasks', element: <TaskBoardPage /> },
    ],
  },
  { path: '/settings/creative-identity', element: withAuth(<CreativeIdentityEditPage />) },
  { path: '/payments', element: withAuth(<PaymentsDashboardPage />) },
  { path: '/contracts', element: withAuth(<ContractListPage />) },
  { path: '/booking', element: withAuth(<BookingInquiryPage />) },
  { path: '/booking/inquiries', element: withAuth(<BookingInquiryPage />) },
  { path: '/deals', element: withAuth(<DealPipelinePage />) },
  { path: '/deals/:dealId', element: withAuth(<DealDetailPage />) },
  { path: '/brands', element: withAuth(<BrandListPage />) },
  { path: '/brands/:brandId', element: withAuth(<BrandDetailPage />) },
  { path: '/collaborations', element: withAuth(<CollaborationMarketplacePage />) },
  { path: '/collaborations/new', element: withAuth(<PostCollaborationPage />) },
  { path: '/collaborations/me/created', element: withAuth(<MyCollaborationsPage />) },
  { path: '/collaborations/me/applications', element: withAuth(<MyCollaborationApplicationsPage />) },
  { path: '/collaborations/:collaborationId', element: withAuth(<CollaborationDetailPage />) },
  { path: '/feed', element: withAuth(<ActivityFeedPage />) },
  { path: '/activity', element: withAuth(<ActivityFeedPage />) },
  { path: '/operating/command-center', element: withAuth(<ExecutiveCommandCenterPage />) },
  { path: '/dashboard/intelligence', element: withAuth(<ExecutiveCommandCenterPage />) },
  { path: '/operating/opportunity-generation', element: withAuth(<OpportunityGenerationQueuePage />) },
  { path: '/operating/analytics/opportunity-generation', element: withAuth(<OpportunityGenerationQueuePage />) },
  { path: '/operating/talent-discovery', element: withAuth(<TalentDiscoveryPage />) },
  { path: '/operating/analytics/talent-discovery', element: withAuth(<TalentDiscoveryPage />) },
  {
    path: '/operating/communities',
    element: withAuth(<Navigate to="/operating/communities/com-tsc-underground" replace />),
  },
  { path: '/operating/communities/:communityId', element: withAuth(<CommunityDashboardPage />) },
  { path: '/operating/communities/:communityId/leader', element: withAuth(<CommunityLeaderPortal />) },
  { path: '/operating/opportunities/marketplace', element: withAuth(<OpportunityMarketplacePage />) },
  { path: '/operating/opportunities/:opportunityId', element: withAuth(<OpportunityDetailPage />) },
  { path: '/operating/artists/:artistId', element: withAuth(<ArtistWorkspacePage />) },
  { path: '/operating/artists/:artistId/career-os', element: withAuth(<CareerOSPage />) },
  { path: '/operating/artists/:artistId/audience-os', element: withAuth(<ArtistAudienceOSPage />) },
  {
    path: '/operating/communities/:communityId/audience-os',
    element: withAuth(<CommunityAudienceOSPage />),
  },
  { path: '/copilot', element: withAuth(<CopilotPage />) },
  { path: '/operating/copilot', element: withAuth(<CopilotPage />) },
  { path: '/commerce', element: withAuth(<FanCommerceBrowsePage />) },
  { path: '/support/history', element: withAuth(<SupportHistoryPage />) },
  { path: '/rewards', element: withAuth(<RewardsCatalogPage />) },
  { path: '/rewards/redemptions', element: withAuth(<MyRedemptionsPage />) },
  { path: '/', element: withAuth(<Navigate to="/workspace" replace />) },
  { path: '*', element: <Navigate to="/workspace" replace /> },
];
