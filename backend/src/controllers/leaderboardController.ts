/**
 * @file leaderboardController.ts
 * @description Controller querying highest scores, deepest stage clears, and aggregating top player statistics.
 */

import type { Request, Response, NextFunction } from "express";
import * as leaderboardService from "../services/leaderboardService.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Parse ?limit= (1 to MAX_LIMIT). Returns null if invalid.
function parseLimit(value: unknown): number | null {
    if (value === undefined) return DEFAULT_LIMIT;
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;

    const limit = Number(value);
    return limit <= MAX_LIMIT ? limit : null;
}

function sendInvalidLimit(res: Response): void {
    res.status(400).json({ message: `limit must be between 1 and ${MAX_LIMIT}.` });
}

// Top completed runs by score
export async function getTopScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const limit = parseLimit(req.query.limit);
        if (limit === null) return sendInvalidLimit(res);

        const runs = await leaderboardService.getTopScores(limit);
        res.status(200).json(runs);
    } catch (error) {
        next(error);
    }
}

// Top completed runs by deepest stage reached
export async function getDeepestRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const limit = parseLimit(req.query.limit);
        if (limit === null) return sendInvalidLimit(res);

        const runs = await leaderboardService.getDeepestRuns(limit);
        res.status(200).json(runs);
    } catch (error) {
        next(error);
    }
}

// Player rankings with aggregate stats
export async function getTopPlayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const limit = parseLimit(req.query.limit);
        if (limit === null) return sendInvalidLimit(res);

        const players = await leaderboardService.getTopPlayers(limit);
        res.status(200).json(players);
    } catch (error) {
        next(error);
    }
}
