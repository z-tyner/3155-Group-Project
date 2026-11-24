/**
 * @file user.ts
 * @description Frontend TypeScript types for User models, credentials, login responses, and profile updates.
 */

export interface User {
    id: number;
    username: string;
    email: string;
    created_at: string;
}

export interface SignupCredentials {
    username: string;
    email: string;
    password: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface UserProfileUpdate {
    username?: string;
    email?: string;
    password?: string;
}
