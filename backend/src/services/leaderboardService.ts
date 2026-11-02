/**
 * @file leaderboardService.ts
 * @description Queries for leaderboard rankings: top run scores, deepest stage clears, and per-player stats.
 * Only completed runs count toward the leaderboard.
 */

import { sql } from "kysely";
import { db } from "../config/db.js";

// Shared base query: completed runs with player name and character name
function completedRuns() {
    return db
        .selectFrom("runs")
        .innerJoin("users", "users.id", "runs.user_id")
        .leftJoin("characters", "characters.id", "runs.character_id")
        .select([
            "runs.id as run_id",
            "runs.user_id",
            "users.username",
            "characters.title as character_title",
            "runs.score",
            "runs.level_reached",
            "runs.completed_at",
        ])
        .where("runs.completed_at", "is not", null);
}

// Highest scoring runs. Ties go to whoever finished first.
export async function getTopScores(limit: number) {
    return await completedRuns()
        .orderBy("runs.score", "desc")
        .orderBy("runs.completed_at", "asc")
        .limit(limit)
        .execute();
}

// Runs that reached the deepest stage. Ties broken by score.
export async function getDeepestRuns(limit: number) {
    return await completedRuns()
        .orderBy("runs.level_reached", "desc")
        .orderBy("runs.score", "desc")
        .limit(limit)
        .execute();
}

// One row per player: best score, deepest stage, runs completed, average score
export async function getTopPlayers(limit: number) {
    return await db
        .selectFrom("runs")
        .innerJoin("users", "users.id", "runs.user_id")
        .select([
            "users.id as user_id",
            "users.username",
            sql<number>`max(runs.score)`.as("best_score"),
            sql<number>`max(runs.level_reached)`.as("deepest_level"),
            sql<number>`count(runs.id)::int`.as("runs_completed"),
            sql<number>`round(avg(runs.score)::numeric, 2)::float`.as("average_score"),
        ])
        .where("runs.completed_at", "is not", null)
        .groupBy(["users.id", "users.username"])
        .orderBy("best_score", "desc")
        .limit(limit)
        .execute();
}
