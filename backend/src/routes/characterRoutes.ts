/**
 * @file characterRoutes.ts
 * @description Route definitions for `/api/characters` CRUD endpoints and multipart sprite image upload middleware hooks.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    createCharacter,
    getAllCharacters,
    getCharacterById,
    updateCharacter,
    deleteCharacter,
} from "../controllers/characterController.js";

const router = Router();

// Retrieve all characters (optional ?preset=true, ?user_id=)
router.get("/", getAllCharacters);

// Retrieve a single character by ID
router.get("/:id", getCharacterById);

// Create a new character
// TODO: add multipart sprite upload middleware here once upload.ts is implemented
router.post("/", authenticateToken, createCharacter);

// Update an existing character (creator only)
router.patch("/:id", authenticateToken, updateCharacter);

// Delete an existing character (creator only)
router.delete("/:id", authenticateToken, deleteCharacter);

export default router;
