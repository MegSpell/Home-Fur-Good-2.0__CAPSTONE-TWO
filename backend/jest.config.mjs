// backend/jest.config.mjs
// ---------------------------------------------
// Jest config for the backend (Node + ESM)
//
// - Uses Node test environment
// - Looks for tests in __tests__/
// - Runs __tests__/_testSetup.js before each test
// ---------------------------------------------

export default {
  // Use Node-style environment (no DOM)
  testEnvironment: "node",

  // Where Jest should look for test files
  roots: ["<rootDir>/__tests__"],

  // Any *.test.js file inside __tests__ will be picked up
  testMatch: ["**/*.test.js"],

  // We are NOT using Babel or TS transforms here
  transform: {},

  // Let Jest handle .js based on package.json "type": "module"
  moduleFileExtensions: ["js", "json", "node"],

  // Run this file before each test suite
  setupFilesAfterEnv: ["<rootDir>/__tests__/_testSetup.js"]
};