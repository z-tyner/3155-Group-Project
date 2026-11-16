/**
 * @file postRoutes.ts
 * @description Defines API endpoints for forum post operations.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost
} from "../controllers/postController.js";

const router = Router();

// Retrieve all forum posts
router.get("/", getAllPosts);

// Retrieve a single forum post
router.get("/:id", getPostById);

// Create a new forum post
router.post("/", authenticateToken, createPost);

// Update an existing forum post
router.patch("/:id", authenticateToken, updatePost);

// Delete an existing forum post
router.delete("/:id", authenticateToken, deletePost);

export default router;
