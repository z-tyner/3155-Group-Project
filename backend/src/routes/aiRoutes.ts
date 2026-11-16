/**
 * @file aiRoutes.ts
 * @description Express route definitions for AI features, including POST `/api/ai/generate-card` for "The Grand Mutator".
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { generateCard } from "../controllers/aiController.js";

const router = Router();

// Generate a card preview from a text prompt (login required so the Groq key isn't open to anyone)
router.post("/generate-card", authenticateToken, generateCard);

export default router;
