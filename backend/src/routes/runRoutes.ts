/**
 * @file runRoutes.ts
 * @description Route definitions for `/api/runs` endpoints handling game run creation, card drafting events, and run completion.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    createRun,
    getMyRuns,
    getRunById,
    draftCard,
    updateRunProgress,
    completeRun,
    deleteRun
} from "../controllers/runController.js";

const router = Router();

// Retrieve the logged-in user's runs (before "/:id" so "me" isn't read as an ID)
router.get("/me", authenticateToken, getMyRuns);

// Retrieve a single run with its drafted cards
router.get("/:id", getRunById);

// Start a new run
router.post("/", authenticateToken, createRun);

// Record a drafted card at the end of a stage
router.post("/:id/cards", authenticateToken, draftCard);

// Update score / stage mid-run
router.patch("/:id", authenticateToken, updateRunProgress);

// Finish a run with final score and stage
router.post("/:id/complete", authenticateToken, completeRun);

// Delete a run
router.delete("/:id", authenticateToken, deleteRun);

export default router;
