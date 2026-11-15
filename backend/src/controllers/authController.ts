/**
 * @file authController.ts
 * @description Controller handling user registration, authentication, JWT token generation, credential verification, and profile retrieval.
 */

import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function isDuplicateKeyError(error: unknown): boolean {
    return (error as { code?: string })?.code === "23505";
}

/**
 * Register a new user account.
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { username, email, password } = req.body ?? {};

        if (typeof username !== "string" || username.trim().length === 0) {
            res.status(400).json({ message: "Username is required." });
            return;
        }

        if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
            res.status(400).json({ message: "A valid email address is required." });
            return;
        }

        if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
            res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
            });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await authService.findUserByEmail(normalizedEmail);
        if (existing) {
            res.status(409).json({ message: "An account with that email already exists." });
            return;
        }

        const user = await authService.createUser({
            username: username.trim(),
            email: normalizedEmail,
            password
        });

        const token = authService.generateToken({
            id: user.id,
            username: user.username,
            email: user.email
        });

        res.status(201).json({ user, token });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            res.status(409).json({ message: "An account with that email already exists." });
            return;
        }
        next(error);
    }
}

/**
 * Log into an existing user account.
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body ?? {};

        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            res.status(400).json({ message: "Email and password are required." });
            return;
        }

        const user = await authService.findUserByEmail(email.toLowerCase().trim());
        if (!user) {
            res.status(401).json({ message: "Invalid email or password." });
            return;
        }

        const passwordValid = await authService.verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            res.status(401).json({ message: "Invalid email or password." });
            return;
        }

        const safeUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
        };

        const token = authService.generateToken({
            id: user.id,
            username: user.username,
            email: user.email
        });

        res.status(200).json({ user: safeUser, token });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const user = await authService.findUserById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}
