/**
 * @file postService.ts
 * @description Manages business logic for creating, retrieving, updating, and deleting forum posts.
 */

import { db } from "../config/db.js";

// Data required to create a post
export interface CreatePostData {
    user_id: number;
    title: string;
    content: string;
}

// Data that can be changed when editing a post
export interface UpdatePostData {
    title?: string;
    content?: string;
}

// Create a new post
export async function createPost(data: CreatePostData) {
    const post = await db
        .insertInto("posts")
        .values({
            user_id: data.user_id,
            title: data.title,
            content: data.content,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

  return post;
}

// Retrieve all posts
export async function getAllPosts() {
    const posts = await db
        .selectFrom("posts")
        .selectAll()
        .orderBy("created_at", "desc")
        .execute();

  return posts;
}

// Retrieve a single post by ID
export async function getPostById(postId: number) {
    const post = await db
        .selectFrom("posts")
        .selectAll()
        .where("id", "=", postId)
        .executeTakeFirst();

  return post ?? null;
}

// Update an existing post
export async function updatePost(postId: number, userId: number, data: UpdatePostData) {
    const post = await db
        .updateTable("posts")
        .set({...data, updated_at: new Date(), })
        .where("id", "=", postId)
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

  return post ?? null;
}

// Delete an existing post
export async function deletePost(postId: number, userId: number) {
    const deletedPost = await db
        .deleteFrom("posts")
        .where("id", "=", postId)
        .where("user_id", "=", userId)
        .returning("id")
        .executeTakeFirst();

  return deletedPost !== undefined;
}
