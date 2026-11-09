/**
 * @file post.ts
 * @description Frontend TypeScript types and interfaces for forum posts, comments, post author details, and forum payloads.
 */

export interface Post {
    id: number;
    user_id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: number;
    user_id: number;
    post_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePostData {
    title: string;
    content: string;
}

export interface UpdatePostData {
    title?: string;
    content?: string;
}

export interface CreateCommentData {
    content: string;
}

export interface UpdateCommentData {
    content: string;
}
