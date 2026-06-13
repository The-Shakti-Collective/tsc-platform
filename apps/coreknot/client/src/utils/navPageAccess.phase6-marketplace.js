/** Phase 6 marketplace nav access — merge into navPageAccess.js when present. */
export const PHASE6_MARKETPLACE_NAV_PATH_ACCESS = {
  '/operating/opportunities/marketplace': 'opportunities',
  '/operating/opportunities/:opportunityId': 'opportunities',
};

export const PHASE6_MARKETPLACE_NAV_PATH_PREFIXES = [
  ['/operating/opportunities/marketplace', 'opportunities'],
  ['/operating/opportunities/', 'opportunities'],
];

/** App.jsx route registration patch */
export const PHASE6_MARKETPLACE_ROUTES = `
import OpportunityMarketplacePage from './pages/operating/opportunities/OpportunityMarketplacePage';
import OpportunityDetailPage from './pages/operating/opportunities/OpportunityDetailPage';

// Inside operating routes:
<Route path="opportunities/marketplace" element={<OpportunityMarketplacePage />} />
<Route path="opportunities/:opportunityId" element={<OpportunityDetailPage />} />
`;
