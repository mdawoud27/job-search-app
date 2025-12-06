/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Tell Jest to handle ES modules
  extensionsToTreatAsEsm: ['.js'],

  // Module name mapper for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform ignore patterns - don't ignore ES modules in node_modules
  transformIgnorePatterns: ['node_modules/(?!(your-esm-package-here)/)'],
};

export default config;
