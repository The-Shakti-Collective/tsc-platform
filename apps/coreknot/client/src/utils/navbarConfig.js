/** Canonical navbar structure — mirrors server NavbarPreference.DEFAULT_NAVBAR_GROUPS */

export const LEGACY_NAV_GROUP_IDS = new Set(['platform', 'workspace', 'office', 'crm', 'management', 'admin', 'primary', 'tools', 'hubs']);

export const HUB_CONFIG = {
  '/crm': {
    label: 'CRM',
    accessKey: 'crm_hub',
    childKeys: ['leads', 'followups', 'bookings', 'contacts'],
    defaultTab: 'leads',
    tabs: [
      { id: 'leads', label: 'Leads', key: 'leads' },
      { id: 'followups', label: 'Followups', key: 'followups' },
      { id: 'bookings', label: 'Bookings', key: 'bookings' },
      { id: 'contacts', label: 'Contacts', key: 'contacts' },
    ],
  },
  '/office': {
    label: 'People & Office',
    accessKey: 'office_hub',
    childKeys: ['equipment', 'contacts', 'subscriptions'],
    defaultTab: 'contacts',
    tabs: [
      { id: 'equipment', label: 'Equipment', key: 'equipment' },
      { id: 'contacts', label: 'Contacts', key: 'contacts' },
      { id: 'subscriptions', label: 'Subscriptions', key: 'subscriptions' },
    ],
  },
  '/management': {
    label: 'Management',
    accessKey: 'management_hub',
    childKeys: ['finance', 'announcements', 'ops_logs', 'artists'],
    defaultTab: 'artists',
    tabs: [
      { id: 'finance', label: 'Finance', key: 'finance' },
      { id: 'announcements', label: 'Announcements', key: 'announcements' },
      { id: 'ops-logs', label: 'Ops Logs', key: 'ops_logs' },
      { id: 'artists', label: 'Artists', key: 'artists' },
    ],
  },
  '/admin/console': {
    label: 'Admin',
    accessKey: 'admin_console',
    childKeys: [
      'admin_users',
      'admin_teams',
      'admin_roles',
      'admin_data',
      'admin_artist_path',
      'admin_exly',
      'admin_scripts',
      'admin_gamification',
      'admin_project_analytics',
    ],
    tiles: [
      { id: 'users', label: 'Users', path: '/admin/users', key: 'admin_users', icon: 'Users' },
      { id: 'teams', label: 'Teams', path: '/admin/teams', key: 'admin_teams', icon: 'Building2' },
      { id: 'roles', label: 'Roles', path: '/admin/roles', key: 'admin_roles', icon: 'Shield' },
      { id: 'data-hub', label: 'Data Hub', path: '/admin', key: 'admin_data', icon: 'Database' },
      { id: 'artist-path', label: 'Artist Path', path: '/admin/artist-path', key: 'admin_artist_path', icon: 'Music' },
      { id: 'exly', label: 'Exly Data', path: '/admin/exly-campaigns', key: 'admin_exly', icon: 'BarChart2' },
      { id: 'scripts', label: 'Script Runner', path: '/admin/scripts', key: 'admin_scripts', icon: 'Brackets' },
      { id: 'gamification', label: 'Gamification', path: '/admin/gamification', key: 'admin_gamification', icon: 'Trophy' },
      { id: 'project-analytics', label: 'Project Analytics', path: '/admin/project-analytics', key: 'admin_project_analytics', icon: 'BarChart3' },
      { id: 'qa', label: 'QA Testing', path: '/admin/qa', key: 'admin_data', icon: 'Activity' },
    ],
  },
};

/** Standalone child paths folded into hubs (excluded from duplicate sidebar entries). */
const HUB_CHILD_PATHS = new Set([
  '/leads',
  '/followups',
  '/bookings',
  '/equipment',
  '/contacts',
  '/subscriptions',
  '/finance',
  '/announcements',
  '/ops-logs',
  '/artists',
  '/admin/users',
  '/admin/teams',
  '/admin/roles',
  '/admin',
  '/admin/artist-path',
  '/admin/exly-campaigns',
  '/admin/scripts',
  '/admin/gamification',
  '/admin/project-analytics',
  '/admin/qa',
]);

export { HUB_CHILD_PATHS };

export const DEFAULT_NAVBAR_GROUPS = [
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

const V2_NAV_GROUP_IDS = new Set(['home', 'crm', 'artists', 'projects', 'operations', 'finance', 'platform']);

function isLegacyNavbarGroups(groups) {
  return (groups || []).some((g) => LEGACY_NAV_GROUP_IDS.has(g.id));
}

function isV2NavbarGroups(groups) {
  return (groups || []).some((g) => V2_NAV_GROUP_IDS.has(g.id));
}

function getHubPathForChildPath(path) {
  const base = (path || '').split('?')[0];
  if (['/leads', '/followups', '/bookings'].includes(base)) return '/crm';
  if (['/equipment', '/contacts', '/subscriptions'].includes(base)) return '/office';
  if (['/finance', '/announcements', '/ops-logs', '/artists'].includes(base)) return '/management';
  if (base.startsWith('/admin')) return '/admin/console';
  return null;
}

/** Reset V2 saved layouts to classic 3-group sidebar. */
export function mergeLegacyNavbarGroups(groups) {
  if (!groups?.length || isV2NavbarGroups(groups)) {
    return DEFAULT_NAVBAR_GROUPS;
  }
  if (isLegacyNavbarGroups(groups)) {
    return groups;
  }
  return groups;
}

export { isLegacyNavbarGroups, getHubPathForChildPath };
