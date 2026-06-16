/** Static customization defaults — no Mongoose dependency (Mongo sunset). */

const DEPARTMENT_PRESETS = {
  sales: {
    name: 'Sales Dashboard',
    department: 'sales',
    elements: [
      { componentId: 'leaderboard', size: '3', order: 1, visible: true },
      { componentId: 'announcements', size: '1', order: 2, visible: true },
      { componentId: 'schedule', size: '1', order: 3, visible: true },
      { componentId: 'todos-today', size: '1', order: 4, visible: true },
      { componentId: 'notes', size: '1', order: 5, visible: true },
    ],
  },
  development: {
    name: 'Developer Dashboard',
    department: 'development',
    elements: [
      { componentId: 'review-queue', size: '3', order: 1, visible: true },
      { componentId: 'todos-today', size: '3', order: 2, visible: true },
      { componentId: 'projects-today', size: '3', order: 3, visible: true },
      { componentId: 'stats', size: '1', order: 4, visible: true },
      { componentId: 'notes', size: '1', order: 5, visible: true },
    ],
  },
  hr: {
    name: 'HR Dashboard',
    department: 'hr',
    elements: [
      { componentId: 'announcements', size: '3', order: 1, visible: true },
      { componentId: 'schedule', size: '3', order: 2, visible: true },
      { componentId: 'todos-today', size: '1', order: 3, visible: true },
      { componentId: 'notes', size: '1', order: 4, visible: true },
    ],
  },
  marketing: {
    name: 'Marketing Dashboard',
    department: 'marketing',
    elements: [
      { componentId: 'stats', size: '3', order: 1, visible: true },
      { componentId: 'announcements', size: '1', order: 2, visible: true },
      { componentId: 'schedule', size: '1', order: 3, visible: true },
      { componentId: 'todos-today', size: '3', order: 4, visible: true },
      { componentId: 'notes', size: '1', order: 5, visible: true },
    ],
  },
};

const DEFAULT_NAVBAR_GROUPS = [
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
  DEPARTMENT_PRESETS,
  DEFAULT_NAVBAR_GROUPS,
};
