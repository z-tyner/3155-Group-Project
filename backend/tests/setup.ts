/**
 * @file setup.ts
 * @description Global Jest test configuration, database lifecycle hooks (beforeAll, beforeEach, afterAll), and test client initialization.
 */

import { db } from "../src/config/db.js";
import { resetDatabase } from "./helpers.js";

// Every test starts with empty tables
beforeEach(async () => {
    await resetDatabase();
});

// Close the connection pool so Jest can exit
afterAll(async () => {
    await db.destroy();
});
