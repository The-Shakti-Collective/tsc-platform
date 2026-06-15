import React from 'react';
import TabHubLayout from './TabHubLayout';
import CalendarView from '../calendar/CalendarView';
import TodoPage from '../todo/TodoPage';
import InboxPage from '../inbox/InboxPage';
import AssetsPage from '../assets/AssetsPage';
import ExlyBookingsPage from '../crm/ExlyBookingsPage';

export default function OperationsHub() {
  return (
    <TabHubLayout
      hubPath="/operations"
      panels={{
        calendar: CalendarView,
        gigs: ExlyBookingsPage,
        tasks: TodoPage,
        documents: AssetsPage,
        approvals: InboxPage,
      }}
    />
  );
}
