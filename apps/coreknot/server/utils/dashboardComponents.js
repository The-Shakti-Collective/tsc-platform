const { isAdminUser } = require('./departmentPermissions');

const COMPONENT_ACCESS = {
  leaderboard: ['all'],
  'daily-missions': ['all'],
  announcements: ['all'],
  pinboard: ['all'],
  schedule: ['all'],
  'review-queue': ['all'],
  'todos-today': ['all'],
  'todos-overdue': ['all'],
  'projects-today': ['all'],
  notes: ['all'],
  composer: ['all'],
  'mark-attendance': ['all'],
  'leave-alerts': ['operations', 'admin'],
  'invoice-alerts': ['operations', 'admin'],
  'attendance-overview': ['operations', 'admin'],
  'team-activity': ['admin', 'operations'],
  'booked-calls': ['sales'],
  'followups-today': ['sales'],
  'pipeline-summary': ['sales', 'admin'],
  'campaign-metrics': ['sales', 'admin'],
  'dept-stats': ['admin'],
  'system-health': ['admin'],
  'observability-links': ['admin'],
  'last-backup': ['admin'],
  'artist-calendar': ['artist-management'],
};

/** Legacy widget ids still stored in old presets */
const LEGACY_COMPONENT_IDS = ['stats'];

const VALID_DASHBOARD_COMPONENT_IDS = [
  ...Object.keys(COMPONENT_ACCESS),
  ...LEGACY_COMPONENT_IDS,
];

function getPermissionPreset(user) {
  if (isAdminUser(user)) return 'admin';
  const dept = user?.departmentId;
  if (!dept || typeof dept !== 'object') return 'standard';
  return dept.permissionPreset || dept.slug || 'standard';
}

function canAccessComponent(componentId, user) {
  const access = COMPONENT_ACCESS[componentId];
  if (!access) return false;
  const preset = getPermissionPreset(user);
  return access.includes('all') || access.includes(preset);
}

function filterDashboardElements(elements, user) {
  if (!Array.isArray(elements)) return [];
  return elements.filter((el) => canAccessComponent(el.componentId, user));
}

const GRID_COLS = 4;
const VALID_SIZES = ['1', '2', '3', '4'];

function normalizeDashboardElement(el, order = 1) {
  const sizeNum = Math.max(1, Math.min(4, parseInt(String(el?.size ?? '1'), 10) || 1));
  const size = String(sizeNum);
  const maxCol = GRID_COLS - sizeNum + 1;
  const col = Math.max(1, Math.min(parseInt(el?.col, 10) || 1, maxCol));
  const row = Math.max(1, parseInt(el?.row, 10) || 1);

  return {
    componentId: el.componentId,
    size,
    col,
    row,
    order: Math.max(1, parseInt(el?.order, 10) || order),
    visible: el?.visible !== false,
  };
}

function normalizeDashboardElements(elements) {
  if (!Array.isArray(elements)) return [];
  return elements.map((el, idx) => normalizeDashboardElement(el, idx + 1));
}

function validateDashboardElement(element) {
  if (!VALID_DASHBOARD_COMPONENT_IDS.includes(element.componentId)) {
    return `Invalid component: ${element.componentId}`;
  }
  const sizeNum = parseInt(String(element.size), 10) || 0;
  if (!VALID_SIZES.includes(String(sizeNum))) {
    return `Invalid size: ${element.size}`;
  }
  const col = parseInt(element.col, 10) || 0;
  if (col < 1 || col > GRID_COLS || col + sizeNum - 1 > GRID_COLS) {
    return `Invalid grid position for ${element.componentId}`;
  }
  const row = parseInt(element.row, 10) || 0;
  if (row < 1) {
    return `Invalid row for ${element.componentId}`;
  }
  return null;
}

module.exports = {
  canAccessComponent,
  filterDashboardElements,
  getPermissionPreset,
  normalizeDashboardElement,
  normalizeDashboardElements,
  validateDashboardElement,
  VALID_DASHBOARD_COMPONENT_IDS,
};
