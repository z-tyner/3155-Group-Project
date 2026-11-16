/**
 * @file aiController.ts
 * @description Controller for AI features: "The Grand Mutator" card generation from a text prompt.
 */

import type { Request, Response, NextFunction } from "express";
import * as aiService from "../services/aiService.js";

// Generate a card preview from the player's prompt (nothing is saved)
export async function generateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // authenticateToken runs before this, so req.user is always set here
        const userId = (req as Request & { user?: { id: number } }).user?.id;
        if (typeof userId !== "number") {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const card = await aiService.generateCard(req.body?.prompt, userId);
        res.status(200).json(card);
    } catch (err) {
        if (err instanceof aiService.AiCardError) {
            if (err.retryAfterSeconds !== undefined) {
                res.set("Retry-After", String(err.retryAfterSeconds));
            }
            res.status(err.status).json({ message: err.message, retryAfterSeconds: err.retryAfterSeconds });
            return;
        }
        next(err);
    }
}
