/** CoreKnot sidebar contracts — Foundation Reset + Phase 2 Operating System + Phase 5 Command Center. */

const FOUNDATION_V2_PATHS = [
  { path: '/dashboard', label: 'Dashboard', order: 1 },
  { path: '/foundation/people', label: 'People', order: 2 },
  { path: '/foundation/organizations', label: 'Organizations', order: 3 },
  { path: '/foundation/artists', label: 'Artists', order: 4 },
  { path: '/foundation/opportunities', label: 'Opportunities', order: 5 },
  { path: '/calendar', label: 'Calendar', order: 6 },
  { path: '/foundation/finance', label: 'Finance', order: 7 },
  { path: '/assets', label: 'Assets', order: 8 },
  { path: '/todo', label: 'Tasks', order: 9 },
  { path: '/foundation/analytics', label: 'Analytics', order: 10 },
  { path: '/foundation/analytics/industry-intelligence', label: 'Industry Intelligence', order: 11 },
  { path: '/settings', label: 'Settings', order: 12 },
];

const OPERATING_V2_PATHS = [
  { path: '/operating/dashboard', label: 'Dashboard', order: 1 },
  { path: '/operating/command-center', label: 'Command Center', order: 2 },
  { path: '/operating/communities/com-tsc-underground', label: 'TSC Underground', order: 3 },
  { path: '/operating/people', label: 'People', order: 4 },
  { path: '/operating/organizations', label: 'Organizations', order: 5 },
  { path: '/operating/artists', label: 'Artists', order: 6 },
  { path: '/operating/projects', label: 'Projects', order: 7 },
  { path: '/operating/opportunities', label: 'Opportunities', order: 8 },
  { path: '/operating/opportunities/marketplace', label: 'Marketplace', order: 8.5 },
  { path: '/operating/events', label: 'Events', order: 9 },
  { path: '/calendar', label: 'Calendar', order: 10 },
  { path: '/operating/finance', label: 'Finance', order: 11 },
  { path: '/assets', label: 'Assets', order: 12 },
  { path: '/todo', label: 'Tasks', order: 13 },
  { path: '/operating/analytics', label: 'Analytics', order: 14 },
  { path: '/operating/analytics/industry-intelligence', label: 'Industry Intelligence', order: 15 },
  { path: '/operating/search', label: 'Search', order: 16 },
  { path: '/settings', label: 'Settings', order: 17 },
];

const FOUNDATION_V2_NAVBAR_GROUPS = [
  {
    id: 'foundation',
    title: 'CoreKnot',
    order: 1,
    visible: true,
    isCustom: false,
    flat: true,
    pages: FOUNDATION_V2_PATHS.map((p) => ({ ...p, visible: true })),
  },
];

const OPERATING_V2_NAVBAR_GROUPS = [
  {
    id: 'operating',
    title: 'CoreKnot',
    order: 1,
    visible: true,
    isCustom: false,
    flat: true,
    pages: OPERATING_V2_PATHS.map((p) => ({ ...p, visible: true })),
  },
];

/** Legacy hub IA — kept for users with saved navbar prefs. */
const LEGACY_V1_NAVBAR_GROUPS = [
  {
    id: 'primary',
    title: 'Primary',
    order: 1,
    visible: true,
    isCustom: false,
    flat: true,
    pages: [
      { path: '/dashboard', label: 'Dashboard', order: 1, visible: true },
      { path: '/projects', label: 'Projects', order: 2, visible: true },
      { path: '/todo', label: 'Todo', order: 3, visible: true },
      { path: '/inbox', label: 'Inbox', order: 4, visible: true },
      { path: '/attendance', label: 'Attendance', order: 5, visible: true },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    order: 2,
    visible: true,
    isCustom: false,
    defaultOpen: true,
    pages: [
      { path: '/calendar', label: 'Calendar', order: 1, visible: true },
      { path: '/logs', label: 'Daily Logs', order: 2, visible: true },
      { path: '/notes', label: 'Notes', order: 3, visible: true },
      { path: '/assets', label: 'Assets', order: 4, visible: true },
      { path: '/schedule', label: 'Schedule', order: 5, visible: true },
      { path: '/emails', label: 'Emails', order: 6, visible: true },
    ],
  },
  {
    id: 'hubs',
    title: 'Modules',
    order: 3,
    visible: true,
    isCustom: false,
    defaultOpen: false,
    pages: [
      { path: '/crm', label: 'CRM', order: 1, visible: true },
      { path: '/office', label: 'People & Office', order: 2, visible: true },
      { path: '/management', label: 'Management', order: 3, visible: true },
      { path: '/admin/console', label: 'Admin', order: 4, visible: true },
    ],
  },
];

module.exports = {
  FOUNDATION_V2_PATHS,
  FOUNDATION_V2_NAVBAR_GROUPS,
  OPERATING_V2_PATHS,
  OPERATING_V2_NAVBAR_GROUPS,
  LEGACY_V1_NAVBAR_GROUPS,
};
