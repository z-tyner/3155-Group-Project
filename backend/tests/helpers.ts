/**
 * @file helpers.ts
 * @description Shared test utilities: a test client, simulated login, database reset, and fixture creation.
 */

import express from "express";
import request from "supertest";
import { sql } from "kysely";
import app from "../src/app.js";
import { db } from "../src/config/db.js";

/*
 * Simulated authentication.
 *
 * The controllers expect auth middleware to verify a JWT and set req.user.id.
 * src/middleware/auth.ts is not implemented yet, so tests wrap the app with a
 * stand-in that sets req.user from a test-only header.
 *
 * Once auth.ts exists, replace this with real login: create the user through
 * /api/auth, get a token, and send "Authorization: Bearer <token>".
 */
const TEST_USER_HEADER = "x-test-user-id";

const testApp = express();
testApp.use((req, _res, next) => {
    const id = req.header(TEST_USER_HEADER);
    if (id !== undefined) {
        (req as express.Request & { user?: { id: number } }).user = { id: Number(id) };
    }
    next();
});
testApp.use(app);

// HTTP client for the app
export function api() {
    return request(testApp);
}

// Headers that make a request come from the given user
export function asUser(user: { id: number }): Record<string, string> {
    return { [TEST_USER_HEADER]: String(user.id) };
}

// Delete all rows from every app table (migration bookkeeping tables are kept)
export async function resetDatabase(): Promise<void> {
    const { rows } = await sql<{ tablename: string }>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename NOT LIKE 'kysely_%'
    `.execute(db);

    if (rows.length === 0) return;

    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`).execute(db);
}

// Users and characters have no working endpoints yet, so they're inserted directly
let userCounter = 0;

export async function createUser(username?: string): Promise<{ id: number; username: string }> {
    userCounter += 1;
    const name = username ?? `user${userCounter}`;

    return await db
        .insertInto("users")
        .values({ username: name, email: `${name}-${userCounter}@test.com`, password_hash: "not-a-real-hash" })
        .returning(["id", "username"])
        .executeTakeFirstOrThrow();
}

export async function createCharacter(user: { id: number }, title = "Test Rat"): Promise<{ id: number; title: string }> {
    return await db
        .insertInto("characters")
        .values({
            user_id: user.id,
            title,
            hp: 100,
            attack: 10,
            defense: 5,
            crit_chance: 5,
            armor_piercing: false,
            is_preset: false,
            sprite_url: "rat.png",
        })
        .returning(["id", "title"])
        .executeTakeFirstOrThrow();
}

// A valid character body; override any field per test
export function characterBody(overrides: Record<string, unknown> = {}) {
    return {
        title: "Swift Rogue",
        hp: 100,
        attack: 15,
        defense: 5,
        crit_chance: 20,
        armor_piercing: true,
        sprite_url: "rogue.png",
        ...overrides,
    };
}

// A valid card body; override any field per test
export function cardBody(overrides: Record<string, unknown> = {}) {
    return {
        title: "Cheese Wedge",
        description: "Restores health",
        effect_type: "heal",
        value: 10,
        image_url: "cheese.png",
        ...overrides,
    };
}

// Small pause so rows created back-to-back get clearly different timestamps
export function tick(ms = 15): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
