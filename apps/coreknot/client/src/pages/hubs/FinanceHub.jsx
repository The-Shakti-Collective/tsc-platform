import React from 'react';
import TabHubLayout from './TabHubLayout';
import FinancePage from '../finance/FinancePage';
import HubSectionPlaceholder from './HubSectionPlaceholder';

const financePanel = () => <FinancePage />;

export default function FinanceHub() {
  return (
    <TabHubLayout
      hubPath="/finance-hub"
      panels={{
        revenue: financePanel,
        expenses: financePanel,
        invoices: financePanel,
        quotations: financePanel,
        reports: () => (
          <HubSectionPlaceholder
            title="Financial Reports"
            description="P&L, cashflow, and artist/project revenue reports — built on finance ledger data."
          />
        ),
      }}
    />
  );
}
