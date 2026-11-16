/**
 * @file postRoutes.ts
 * @description Defines API endpoints for forum post operations.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js"
import { validate, isNonEmptyString } from "../middleware/validate.js";

import {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost
} from "../controllers/postController.js";

const createPostSchema = (data: unknown): string | null => {
    if (typeof data !== "object" || data === null) {
        return "A valid request body is required.";
    }

    const body = data as Record<string, unknown>;

    if (!isNonEmptyString(body.title)) {
        return "Title is required.";
    }

    if (!isNonEmptyString(body.content)) {
        return "Content is required.";
    }

    return null;
};

const router = Router();

// Retrieve all forum posts
router.get("/", getAllPosts);

// Retrieve a single forum post
router.get("/:id", getPostById);

// Create a new forum post
router.post("/", authenticateToken, validate(createPostSchema), createPost);

// Update an existing forum post
router.patch("/:id", authenticateToken, updatePost);

// Delete an existing forum post
router.delete("/:id", authenticateToken, deletePost);

export default router;
