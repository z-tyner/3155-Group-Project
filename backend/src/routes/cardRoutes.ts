/**
 * @file cardRoutes.ts
 * @description Route definitions for `/api/cards` CRUD endpoints and multipart card artwork upload middleware hooks.
 */

import { Router } from "express";
import {
    createCard,
    getAllCards,
    getDraftPool,
    getCardById,
    updateCard,
    deleteCard
} from "../controllers/cardController.js";

const router = Router();

// Retrieve all cards (optional ?user_id=)
router.get("/", getAllCards);

// Retrieve random cards for a stage-clear draft (optional ?count=).
// Must be registered before "/:id" so "draft" isn't read as an ID.
router.get("/draft", getDraftPool);

// Retrieve a single card
router.get("/:id", getCardById);

// Create a new card
// TODO: add upload middleware here once upload.ts is implemented
router.post("/", createCard);

// Update an existing card
router.patch("/:id", updateCard);

// Delete an existing card
router.delete("/:id", deleteCard);

export default router;
