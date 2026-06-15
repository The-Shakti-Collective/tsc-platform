const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  modulePaths: [
    path.dirname(require.resolve('source-map')),
  ],
  clearMocks: true,
  collectCoverageFrom: [
    '**/*.js',
    '!tests/**',
    '!scripts/**',
    '!node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 15,
      branches: 10,
      functions: 10,
      statements: 15,
    },
  },
};
