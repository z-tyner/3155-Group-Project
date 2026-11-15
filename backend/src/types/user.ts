/**
 * @file user.ts
 * @description TypeScript interface definitions for User entities, signup/login credentials, auth payloads, and profile responses.
 */

export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

export type SafeUser = Omit<User, "password_hash">;

export interface SignupDTO {
    username: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthTokenPayload {
    id: number;
    username: string;
    email: string;
}

export interface AuthResponse {
    user: SafeUser;
    token: string;
}
