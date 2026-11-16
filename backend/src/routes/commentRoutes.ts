/**
 * @file commentRoutes.ts
 * @description Defines API endpoints for forum comment operations.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
    createComment,
    getCommentsByPostId,
    getCommentById,
    updateComment,
    deleteComment
} from "../controllers/commentController.js";

const router = Router();

// Retrieve all comments for a specific post
router.get("/posts/:postId/comments", getCommentsByPostId);

// Retrieve a single comment
router.get("/comments/:commentId", getCommentById);

// Create a comment on a post
router.post("/posts/:postId/comments", authenticateToken, createComment);

// Update an existing comment
router.patch("/comments/:commentId", authenticateToken, updateComment);

// Delete an existing comment
router.delete("/comments/:commentId", authenticateToken, deleteComment);

export default router;
