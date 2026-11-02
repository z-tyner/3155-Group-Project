/**
 * @file globalSetup.ts
 * @description Runs once before all test suites: creates the test database if needed
 * and applies all migrations using the project's migrate script.
 */

import { execSync } from "node:child_process";
import pg from "pg";

/*
 * Resolves the database used by the test suite. Tests wipe every table,
 * so this refuses to run against any database whose name doesn't include "test".
 * (Kept in this file because Jest's globalSetup can't import local .ts modules in ESM mode.)
 */
const DEFAULT_TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/rat_game_test";

export function getTestDatabaseUrl(): string {
    const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
    const dbName = new URL(url).pathname.replace(/^\//, "");

    if (!dbName.includes("test")) {
        throw new Error(
            `Refusing to run tests against database "${dbName}". ` +
            `Tests delete all data, so TEST_DATABASE_URL must point at a database with "test" in its name.`
        );
    }

    return url;
}

export default async function globalSetup(): Promise<void> {
    const testUrl = getTestDatabaseUrl();
    const dbName = new URL(testUrl).pathname.replace(/^\//, "");

    // Connect to the default "postgres" database to create the test database
    const adminUrl = new URL(testUrl);
    adminUrl.pathname = "/postgres";

    const client = new pg.Client({ connectionString: adminUrl.toString() });
    await client.connect();

    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
        await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    }

    await client.end();

    // Apply migrations with the same script the team uses for development
    execSync("npx tsx src/db/migrate.ts latest", {
        cwd: process.cwd(), // Jest runs from backend/
        env: { ...process.env, DATABASE_URL: testUrl },
        stdio: "inherit",
    });
}
