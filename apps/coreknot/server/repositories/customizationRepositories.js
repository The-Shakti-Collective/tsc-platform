const { createCustomizationRepository } = require('./createCustomizationRepository');

const CUSTOMIZATION_FLAG = 'COREKNOT_CUSTOMIZATION_STORE';

const dashboardPresetRepository = createCustomizationRepository({
  modelPath: '../models/DashboardPreset',
  entityType: 'DashboardPreset',
  flagName: CUSTOMIZATION_FLAG,
});

const navbarPreferenceRepository = createCustomizationRepository({
  modelPath: '../models/NavbarPreference',
  entityType: 'NavbarPreference',
  flagName: CUSTOMIZATION_FLAG,
});

const shortcutPreferenceRepository = createCustomizationRepository({
  modelPath: '../models/ShortcutPreference',
  entityType: 'ShortcutPreference',
  flagName: CUSTOMIZATION_FLAG,
});

const workspacePreferenceRepository = createCustomizationRepository({
  modelPath: '../models/WorkspacePreference',
  entityType: 'WorkspacePreference',
  flagName: CUSTOMIZATION_FLAG,
});

module.exports = {
  CUSTOMIZATION_FLAG,
  dashboardPresetRepository,
  navbarPreferenceRepository,
  shortcutPreferenceRepository,
  workspacePreferenceRepository,
};
