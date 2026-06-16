const mongoose = require('mongoose');
const { VALID_DASHBOARD_COMPONENT_IDS } = require('../utils/dashboardComponents');
const { DEPARTMENT_PRESETS } = require('../constants/customizationDefaults');

const dashboardPresetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'My Dashboard'
  },
  elements: [{
    componentId: {
      type: String,
      enum: VALID_DASHBOARD_COMPONENT_IDS,
    },
    size: {
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1'
    },
    col: {
      type: Number,
      default: 1,
      min: 1,
      max: 4
    },
    row: {
      type: Number,
      default: 1,
      min: 1
    },
    order: {
      type: Number,
      default: 1
    },
    visible: {
      type: Boolean,
      default: true
    }
  }],
  department: {
    type: String,
    enum: ['sales', 'development', 'hr', 'marketing', 'custom'],
    default: 'custom'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  presets: [{
    name: String,
    department: String,
    elements: [{
      componentId: String,
      size: String,
      col: Number,
      row: Number,
      order: Number,
      visible: Boolean
    }]
  }],
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
}, {
  collection: 'dashboardPresets'
});

dashboardPresetSchema.index({ userId: 1, createdAt: -1 });

// Department presets (static) — canonical source: constants/customizationDefaults.js

module.exports = mongoose.model('DashboardPreset', dashboardPresetSchema);
module.exports.DEPARTMENT_PRESETS = DEPARTMENT_PRESETS;
