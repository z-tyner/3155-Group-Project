/**
 * @file env.ts
 * @description Runs before each test file loads. Points the app's database connection at the test database.
 */

import { getTestDatabaseUrl } from "./globalSetup.js";

process.env.DATABASE_URL = getTestDatabaseUrl();
