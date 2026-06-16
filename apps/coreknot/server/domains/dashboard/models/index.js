/** dashboard domain models — postgres-first via customization store */
const { dashboardPresetRepository } = require('../../../repositories/customizationRepositories');

module.exports = {
  DashboardPreset: dashboardPresetRepository,
};
