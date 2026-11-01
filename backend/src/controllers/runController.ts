/**
 * @file runController.ts
 * @description Controller tracking game runs, recording end-of-stage drafted cards (M:N relationship), final scores, and completion status.
 */

import type { Request, Response, NextFunction } from "express";
import * as runService from "../services/runService.js";
import * as cardService from "../services/cardService.js";

// Get the authenticated user's ID from the request.
// Authentication middleware must verify the JWT and set req.user.id.
function getAuthenticatedUserId(req: Request): number | null {
    const user = (req as Request & { user?: { id: number } }).user;

    return typeof user?.id === "number" && Number.isInteger(user.id) && user.id > 0
        ? user.id
        : null;
}

// Validate positive integer IDs from route parameters
function parseId(value: unknown): number | null {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}

function isValidScore(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidLevel(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

// Start a new run. Body: { character_id? }
export async function createRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const { character_id } = req.body ?? {};
        let characterId: number | null = null;

        if (character_id !== undefined && character_id !== null) {
            if (typeof character_id !== "number" || !Number.isInteger(character_id) || character_id <= 0) {
                res.status(400).json({ message: "Invalid character ID." });
                return;
            }

            if (!(await runService.characterExists(character_id))) {
                res.status(404).json({ message: "Character not found." });
                return;
            }

            characterId = character_id;
        }

        const run = await runService.createRun(userId, characterId);
        res.status(201).json(run);
    } catch (error) {
        next(error);
    }
}

// Retrieve the logged-in user's runs
export async function getMyRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const runs = await runService.getRunsByUser(userId);
        res.status(200).json(runs);
    } catch (error) {
        next(error);
    }
}

// Retrieve a single run with its drafted cards
export async function getRunById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const runId = parseId(req.params.id);

        if (runId === null) {
            res.status(400).json({ message: "Invalid run ID." });
            return;
        }

        const run = await runService.getRunById(runId);

        if (!run) {
            res.status(404).json({ message: "Run not found." });
            return;
        }

        const cards = await runService.getRunCards(runId);
        res.status(200).json({ ...run, cards });
    } catch (error) {
        next(error);
    }
}

// Record a card drafted at the end of a stage. Body: { card_id }
export async function draftCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const runId = parseId(req.params.id);

        if (runId === null) {
            res.status(400).json({ message: "Invalid run ID." });
            return;
        }

        const { card_id } = req.body ?? {};

        if (typeof card_id !== "number" || !Number.isInteger(card_id) || card_id <= 0) {
            res.status(400).json({ message: "A valid card_id is required." });
            return;
        }

        const run = await runService.getRunById(runId);

        if (!run || run.user_id !== userId) {
            res.status(404).json({ message: "Run not found or access denied." });
            return;
        }

        if (run.completed_at !== null) {
            res.status(409).json({ message: "Run is already completed." });
            return;
        }

        const card = await cardService.getCardById(card_id);

        if (!card) {
            res.status(404).json({ message: "Card not found." });
            return;
        }

        const runCard = await runService.draftCard(runId, card_id);
        res.status(201).json(runCard);
    } catch (error) {
        next(error);
    }
}

// Update score / stage mid-run. Body: { score?, level_reached? }
export async function updateRunProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const runId = parseId(req.params.id);

        if (runId === null) {
            res.status(400).json({ message: "Invalid run ID." });
            return;
        }

        const { score, level_reached } = req.body ?? {};

        if (
            (score === undefined && level_reached === undefined) ||
            (score !== undefined && !isValidScore(score)) ||
            (level_reached !== undefined && !isValidLevel(level_reached))
        ) {
            res.status(400).json({ message: "Provide a valid score (>= 0) or level_reached (integer >= 0)." });
            return;
        }

        const data: runService.RunProgressData = {};

        if (score !== undefined) data.score = score;
        if (level_reached !== undefined) data.level_reached = level_reached;

        const run = await runService.updateRunProgress(runId, userId, data);

        if (!run) {
            res.status(404).json({ message: "Run not found, already completed, or access denied." });
            return;
        }

        res.status(200).json(run);
    } catch (error) {
        next(error);
    }
}

// End a run with final results. Body: { score, level_reached }
export async function completeRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const runId = parseId(req.params.id);

        if (runId === null) {
            res.status(400).json({ message: "Invalid run ID." });
            return;
        }

        const { score, level_reached } = req.body ?? {};

        if (!isValidScore(score) || !isValidLevel(level_reached)) {
            res.status(400).json({ message: "score (>= 0) and level_reached (integer >= 0) are required." });
            return;
        }

        const run = await runService.completeRun(runId, userId, { score, level_reached });

        if (!run) {
            res.status(404).json({ message: "Run not found, already completed, or access denied." });
            return;
        }

        res.status(200).json(run);
    } catch (error) {
        next(error);
    }
}

// Delete a run
export async function deleteRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const runId = parseId(req.params.id);

        if (runId === null) {
            res.status(400).json({ message: "Invalid run ID." });
            return;
        }

        const deleted = await runService.deleteRun(runId, userId);

        if (!deleted) {
            res.status(404).json({ message: "Run not found or access denied." });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
