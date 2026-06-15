const {
  isPostgresStoreEnabled,
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresMailEnabled,
  isPostgresDataHubEnabled,
  isPostgresAttendanceEnabled,
  isPostgresFinanceEnabled,
  isPostgresNewsletterEnabled,
  isPostgresIntegrationsEnabled,
  isPostgresGamificationEnabled,
  isPostgresCalendarEnabled,
  isPostgresNotificationsEnabled,
} = require('./prismaClient');

const SOURCE_SYSTEM = 'coreknot';

module.exports = {
  SOURCE_SYSTEM,
  isStoreFlagEnabled: isPostgresStoreEnabled,
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresMailEnabled,
  isPostgresDataHubEnabled,
  isPostgresAttendanceEnabled,
  isPostgresFinanceEnabled,
  isPostgresNewsletterEnabled,
  isPostgresIntegrationsEnabled,
  isPostgresGamificationEnabled,
  isPostgresCalendarEnabled,
  isPostgresNotificationsEnabled,
};
