/**
 * @file jest.config.ts
 * @description Configuration file for Jest test runner, setting up TypeScript pre-processing (ts-jest) and test environment for API integration tests.
 */

import type { Config } from "jest";

const config: Config = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],

    // Source files import with ".js" suffixes (NodeNext style); strip them for Jest
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },

    // The project (and Kysely) use ES modules, so Jest runs in ESM mode.
    // Requires Node's --experimental-vm-modules flag (set in the "test" npm script).
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: { isolatedModules: true } }],
    },

    // Creates + migrates the test database once before all suites
    globalSetup: "<rootDir>/tests/globalSetup.ts",
    // Points DATABASE_URL at the test database before any app code loads
    setupFiles: ["<rootDir>/tests/env.ts"],
    // Clears tables between tests, closes the DB pool at the end
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;
