const path = require('path');

/** CI-safe Jest config — no Mongo memory server setup. */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1,
  modulePaths: [path.dirname(require.resolve('source-map'))],
  clearMocks: true,
  testMatch: [
    '<rootDir>/tests/validation.test.js',
    '<rootDir>/tests/configEnv.test.js',
    '<rootDir>/tests/preflightEnv.test.js',
  ],
};
