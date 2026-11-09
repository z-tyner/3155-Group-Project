/**
 * @file post.ts
 * @description Backend TypeScript types for forum posts, including creation and update payloads.
 */

export interface Post {
    id: number;
    user_id: number;
    title: string;
    content: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePostData {
    user_id: number;
    title: string;
    content: string;
}

export interface UpdatePostData {
    title?: string;
    content?: string;
}
