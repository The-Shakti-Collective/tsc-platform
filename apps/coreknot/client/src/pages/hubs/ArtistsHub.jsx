import React from 'react';
import TabHubLayout from './TabHubLayout';
import ArtistsCollection from '../artists/ArtistsCollection';
import CalendarView from '../calendar/CalendarView';
import AdminProjectAnalyticsPage from '../admin/AdminProjectAnalyticsPage';
import HubSectionPlaceholder from './HubSectionPlaceholder';

export default function ArtistsHub() {
  return (
    <TabHubLayout
      hubPath="/artist-ops"
      panels={{
        directory: ArtistsCollection,
        availability: CalendarView,
        contracts: () => (
          <HubSectionPlaceholder
            title="Artist Contracts"
            description="Org-wide contract registry — open an artist workspace for per-artist contracts."
          />
        ),
        releases: () => (
          <HubSectionPlaceholder
            title="Releases"
            description="Track releases across the roster. Per-artist release detail lives in Artist Workspace."
          />
        ),
        analytics: AdminProjectAnalyticsPage,
        artists: ArtistsCollection,
      }}
    />
  );
}
