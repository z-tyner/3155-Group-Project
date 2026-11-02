/**
 * @file leaderboardRoutes.ts
 * @description Route definitions for `/api/leaderboard` endpoints returning top run scores and player rankings.
 */

import { Router } from "express";
import {
    getTopScores,
    getDeepestRuns,
    getTopPlayers
} from "../controllers/leaderboardController.js";

const router = Router();

// Top runs by score (optional ?limit=, default 10, max 100)
router.get("/", getTopScores);

// Top runs by deepest stage reached
router.get("/levels", getDeepestRuns);

// Player rankings with aggregate stats
router.get("/players", getTopPlayers);

export default router;
