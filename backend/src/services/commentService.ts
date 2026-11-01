/**
 * @file commentService.ts
 * @description Manages business logic for creating, retrieving, updating, and deleting forum comments.
 */

import { db } from "../config/db.js";

// Data required to create a comment
export interface CreateCommentData {
    user_id: number;
    post_id: number;
    content: string;
}

// Data that can be changed when editing a comment
export interface UpdateCommentData {
    content: string;
}

// Create a new comment
export async function createComment(data: CreateCommentData) {
    const comment = await db
        .insertInto("comments")
        .values({user_id: data.user_id, post_id: data.post_id, content: data.content,})
        .returningAll()
        .executeTakeFirstOrThrow();

    return comment;
}

// Retrieve all comments for a specific post
export async function getCommentsByPostId(postId: number) {
    const comments = await db
        .selectFrom("comments")
        .selectAll()
        .where("post_id", "=", postId)
        .orderBy("created_at", "asc")
        .execute();

    return comments;
}

// Retrieve a single comment by ID
export async function getCommentById(commentId: number) {
    const comment = await db
        .selectFrom("comments")
        .selectAll()
        .where("id", "=", commentId)
        .executeTakeFirst();

    return comment ?? null;
}

// Update an existing comment
export async function updateComment(commentId: number, userId: number, data: UpdateCommentData) {
    const comment = await db
        .updateTable("comments")
        .set({content: data.content, updated_at: new Date(), })
        .where("id", "=", commentId)
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    return comment ?? null;
}

// Delete an existing comment
export async function deleteComment(commentId: number, userId: number) {
    const deletedComment = await db
        .deleteFrom("comments")
        .where("id", "=", commentId)
        .where("user_id", "=", userId)
        .returning("id")
        .executeTakeFirst();

    return deletedComment !== undefined;
}
