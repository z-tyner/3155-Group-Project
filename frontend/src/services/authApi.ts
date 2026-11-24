/**
 * @file authApi.ts
 * @description API service methods for authentication endpoints: login, signup, fetch current user, and logout.
 */

import { apiRequest, setStoredToken, clearStoredToken } from "./api.js";
import type {
    User,
    SignupCredentials,
    LoginCredentials,
    AuthResponse,
} from "../types/user.js";

/**
 * Register a new user account.
 */
export async function signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
    if (res?.token) {
        setStoredToken(res.token);
    }
    return res;
}

/**
 * Log into an existing user account.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
    if (res?.token) {
        setStoredToken(res.token);
    }
    return res;
}

/**
 * Fetch the currently authenticated user's profile.
 */
export async function getCurrentUser(): Promise<User> {
    const res = await apiRequest<{ user: User }>("/auth/me", {
        method: "GET",
    });
    return res.user;
}

/**
 * Client-side logout by removing the saved token.
 */
export function logout(): void {
    clearStoredToken();
}
