/**
 * @file userRoutes.ts
 * @description Route definitions for `/api/users` endpoints managing profile views, user updates, and user-specific asset listings.
 */

import { Router } from "express";

import {
    deleteCurrentUser,
    getUserById,
    getUserCards,
    getUserCharacters,
    updateCurrentUser
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Update the currently authenticated user's profile
router.patch("/me", authenticateToken, updateCurrentUser);

// Delete the currently authenticated user's account
router.delete("/me", authenticateToken, deleteCurrentUser);

// Retrieve cards created by a user
router.get("/:id/cards", getUserCards);

// Retrieve characters created by a user
router.get("/:id/characters", getUserCharacters);

// Retrieve a user's public profile
router.get("/:id", getUserById);

export default router;