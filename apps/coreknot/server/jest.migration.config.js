/** Lightweight Jest config for postgres migration unit tests (no MongoMemoryServer setup). */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,
  clearMocks: true,
  testMatch: [
    '**/tests/postgresStoreRepositories.test.js',
    '**/tests/wave2StoreRepositories.test.js',
    '**/tests/staffUserTenantStore.test.js',
  ],
};
