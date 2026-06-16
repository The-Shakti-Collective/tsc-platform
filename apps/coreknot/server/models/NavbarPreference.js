const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');
const { DEFAULT_NAVBAR_GROUPS } = require('../constants/customizationDefaults');

const navbarPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  groups: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    visible: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
    pages: [{
      path: { type: String, required: true },
      label: { type: String, required: true },
      order: { type: Number, required: true },
      visible: { type: Boolean, default: true }
    }]
  }],
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
}, {
  collection: 'navbarPreferences'
});

navbarPreferenceSchema.index({ userId: 1 });
navbarPreferenceSchema.plugin(tenantPlugin);

// Default navbar groups — canonical source: constants/customizationDefaults.js

module.exports = mongoose.model('NavbarPreference', navbarPreferenceSchema);
module.exports.DEFAULT_NAVBAR_GROUPS = DEFAULT_NAVBAR_GROUPS;
