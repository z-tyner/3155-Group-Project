/**
 * @file postController.ts
 * @description Handles HTTP requests and responses for forum posts.
 */

import type { Request, Response, NextFunction } from "express";
import * as postService from "../services/postService.js";

// Read the authenticated user's ID from the request.
// This expects auth middleware to attach req.user.id.
function getAuthenticatedUserId(req: Request): number | null {
    const user = (req as Request & {user?: { id: number }}).user;

    return typeof user?.id === "number" && Number.isInteger(user.id) && user.id > 0
    ? user.id : null;
}

// Create a new post
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);
        
        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }
        
        const { title, content } = req.body ?? {};
        
        if (typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
            res.status(400).json({
                message: "Title and content are required."
            });
            return;
        }

        const post = await postService.createPost({
            user_id: userId,
            title: title.trim(),
            content: content.trim()
        });
    
        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
}

// Retrieve all posts
export async function getAllPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const posts = await postService.getAllPosts();
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
}

// Retrieve a single post
export async function getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const postId = Number(req.params.id);

        if (!Number.isInteger(postId) || postId <= 0) {
            res.status(400).json({ message: "Invalid post ID." });
            return;
        }

        const post = await postService.getPostById(postId);

        if (!post) {
            res.status(404).json({ message: "Post not found." });
            return;
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
}

// Update an existing post
export async function updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const postId = Number(req.params.id);

        if (!Number.isInteger(postId) || postId <= 0) {
            res.status(400).json({ message: "Invalid post ID." });
            return;
        }

        const { title, content } = req.body ?? {};

        if (
            (title === undefined && content === undefined) ||
            (title !== undefined && (typeof title !== "string" || !title.trim())) ||
            (content !== undefined && (typeof content !== "string" || !content.trim()))
        ) {
            res.status(400).json({
                message: "Provide a valid title or content."
            });
            return;
        }

        const data: postService.UpdatePostData = {};

        if (title !== undefined) data.title = title.trim();
        if (content !== undefined) data.content = content.trim();

        const post = await postService.updatePost(postId, userId, data);

        if (!post) {
            res.status(404).json({message: "Post not found or access denied."});
            return;
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
}

// Delete an existing post
export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const postId = Number(req.params.id);

        if (!Number.isInteger(postId) || postId <= 0) {
            res.status(400).json({ message: "Invalid post ID." });
            return;
        }

        const deleted = await postService.deletePost(
        postId,
        userId
        );

        if (!deleted) {
            res.status(404).json({message: "Post not found or access denied."});
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
