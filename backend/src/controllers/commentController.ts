/**
 * @file commentController.ts
 * @description Handles HTTP requests and responses for forum comments.
 */

import type { Request, Response, NextFunction } from "express";
import * as commentService from "../services/commentService.js";
import * as postService from "../services/postService.js";

// Get the authenticated user's ID from the request.
// Authentication middleware must verify the JWT and set req.user.id.
function getAuthenticatedUserId(req: Request): number | null {
    const user = (req as Request & {
        user?: { id: number };
    }).user;

    return typeof user?.id === "number" &&
        Number.isInteger(user.id) &&
        user.id > 0
        ? user.id
        : null;
}

// Validate positive integer IDs from route parameters
function parseId(value: string | string[] | undefined): number | null {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}

// Create a comment on a post
export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const postId = parseId(req.params.postId);

        if (postId === null) {
            res.status(400).json({ message: "Invalid post ID." });
            return;
        }

        const { content } = req.body ?? {};

        if (typeof content !== "string" || !content.trim()) {
            res.status(400).json({message: "Comment content is required."});
            return;
        }

        // Make sure the parent post exists
        const post = await postService.getPostById(postId);

        if (!post) {
            res.status(404).json({ message: "Post not found." });
            return;
        }

        const comment = await commentService.createComment({
            user_id: userId,
            post_id: postId,
            content: content.trim()
        });

        res.status(201).json(comment);
    } catch (error) {
        next(error);
    }
}

// Retrieve all comments for a post
export async function getCommentsByPostId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const postId = parseId(req.params.postId);

        if (postId === null) {
        res.status(400).json({ message: "Invalid post ID." });
        return;
        }

        const post = await postService.getPostById(postId);

        if (!post) {
        res.status(404).json({ message: "Post not found." });
        return;
        }

        const comments = await commentService.getCommentsByPostId(postId);
        res.status(200).json(comments);
    } catch (error) {
        next(error);
    }
    }

    // Retrieve a single comment
    export async function getCommentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const commentId = parseId(req.params.commentId);

        if (commentId === null) {
            res.status(400).json({ message: "Invalid comment ID." });
            return;
        }

        const comment = await commentService.getCommentById(commentId);

        if (!comment) {
            res.status(404).json({ message: "Comment not found." });
            return;
        }

        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
}

// Update an existing comment
export async function updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const commentId = parseId(req.params.commentId);

        if (commentId === null) {
            res.status(400).json({ message: "Invalid comment ID." });
            return;
        }

        const { content } = req.body ?? {};

        if (typeof content !== "string" || !content.trim()) {
            res.status(400).json({message: "Valid comment content is required."});
            return;
        }

        const comment = await commentService.updateComment(
            commentId,
            userId,
            { content: content.trim() }
        );

        if (!comment) {
            res.status(404).json({
                message: "Comment not found or access denied."
            });
        return;
        }

        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
}

// Delete an existing comment
export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const commentId = parseId(req.params.commentId);

        if (commentId === null) {
            res.status(400).json({ message: "Invalid comment ID." });
            return;
        }

        const deleted = await commentService.deleteComment(
        commentId,
        userId
        );

        if (!deleted) {
            res.status(404).json({message: "Comment not found or access denied."});
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
