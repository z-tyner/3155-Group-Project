/**
 * @file comment.ts
 * @description Backend TypeScript types for forum comments, including creation and update payloads.
 */

export interface Comment {
    id: number;
    user_id: number;
    post_id: number;
    content: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateCommentData {
    user_id: number;
    post_id: number;
    content: string;
}

export interface UpdateCommentData {
    content?: string;
}
