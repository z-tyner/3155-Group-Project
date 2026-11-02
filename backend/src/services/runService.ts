/**
 * @file runService.ts
 * @description Manages business logic for game runs: starting runs, recording drafted cards, progress updates, and completion.
 */

import { sql } from "kysely";
import { db } from "../config/db.js";

// Score / stage progress reported by the game
export interface RunProgressData {
    score?: number;
    level_reached?: number;
}

// Final results when a run ends
export interface CompleteRunData {
    score: number;
    level_reached: number;
}

// Check that a character exists before attaching it to a run
export async function characterExists(characterId: number) {
    const character = await db
        .selectFrom("characters")
        .select("id")
        .where("id", "=", characterId)
        .executeTakeFirst();

    return character !== undefined;
}

// Start a new run at score 0, stage 0
export async function createRun(userId: number, characterId: number | null) {
    const run = await db
        .insertInto("runs")
        .values({
            user_id: userId,
            character_id: characterId,
            score: 0,
            level_reached: 0,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    return run;
}

// Retrieve all runs for a user, newest first
export async function getRunsByUser(userId: number) {
    const runs = await db
        .selectFrom("runs")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("created_at", "desc")
        .execute();

    return runs;
}

// Retrieve a single run by ID (without cards)
export async function getRunById(runId: number) {
    const run = await db
        .selectFrom("runs")
        .selectAll()
        .where("id", "=", runId)
        .executeTakeFirst();

    return run ?? null;
}

// Retrieve the cards drafted in a run, with how many times each was picked
export async function getRunCards(runId: number) {
    const cards = await db
        .selectFrom("run_cards")
        .innerJoin("cards", "cards.id", "run_cards.card_id")
        .selectAll("cards")
        .select("run_cards.quantity")
        .where("run_cards.run_id", "=", runId)
        .orderBy("cards.title", "asc")
        .execute();

    return cards;
}

// Record a drafted card. Drafting the same card again increases its quantity.
export async function draftCard(runId: number, cardId: number) {
    const runCard = await db
        .insertInto("run_cards")
        .values({ run_id: runId, card_id: cardId, quantity: 1 })
        .onConflict((oc) =>
            oc.columns(["run_id", "card_id"]).doUpdateSet({
                quantity: sql`run_cards.quantity + 1`,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow();

    return runCard;
}

// Update score / stage on a run that is still in progress
export async function updateRunProgress(runId: number, userId: number, data: RunProgressData) {
    const run = await db
        .updateTable("runs")
        .set(data)
        .where("id", "=", runId)
        .where("user_id", "=", userId)
        .where("completed_at", "is", null)
        .returningAll()
        .executeTakeFirst();

    return run ?? null;
}

// Finish a run with its final score and stage. A run can only be completed once.
export async function completeRun(runId: number, userId: number, data: CompleteRunData) {
    const run = await db
        .updateTable("runs")
        .set({
            score: data.score,
            level_reached: data.level_reached,
            completed_at: new Date(),
        })
        .where("id", "=", runId)
        .where("user_id", "=", userId)
        .where("completed_at", "is", null)
        .returningAll()
        .executeTakeFirst();

    return run ?? null;
}

// Delete a run (its drafted cards are removed by ON DELETE CASCADE)
export async function deleteRun(runId: number, userId: number) {
    const deletedRun = await db
        .deleteFrom("runs")
        .where("id", "=", runId)
        .where("user_id", "=", userId)
        .returning("id")
        .executeTakeFirst();

    return deletedRun !== undefined;
}
