import React from 'react';
import TabHubLayout from './TabHubLayout';
import AdminProjectAnalyticsPage from '../admin/AdminProjectAnalyticsPage';
import FinancePage from '../finance/FinancePage';
import LeadsPage from '../crm/LeadsPage';
import PortfolioDashboard from '../artists/PortfolioDashboard';
import ForecastPanel from '../../components/forecast/ForecastPanel';
import HubSectionPlaceholder from './HubSectionPlaceholder';
import { PageContainer, PageHeader } from '../../components/ui';

function ForecastsPanel() {
  return (
    <PageContainer title="Forecasts" subtitle="Revenue and pipeline forecasts">
      <ForecastPanel />
    </PageContainer>
  );
}

export default function AnalyticsHub() {
  return (
    <TabHubLayout
      hubPath="/analytics"
      panels={{
        artists: PortfolioDashboard,
        finance: FinancePage,
        projects: AdminProjectAnalyticsPage,
        crm: LeadsPage,
        audience: () => (
          <HubSectionPlaceholder
            title="Audience Analytics"
            description="Growth, engagement, and cross-platform audience metrics."
          />
        ),
        forecasts: ForecastsPanel,
      }}
    />
  );
}
