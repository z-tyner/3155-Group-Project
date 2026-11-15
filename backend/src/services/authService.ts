/**
 * @file authService.ts
 * @description Authentication service providing password hashing (bcrypt), password verification, and JWT creation/verification utilities.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import type {
    User,
    SafeUser,
    SignupDTO,
    AuthTokenPayload
} from "../types/user.js";

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Issue a signed JSON Web Token for an authenticated user.
 */
export function generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });
}

/**
 * Verify and decode an incoming JWT token.
 */
export function verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

/**
 * Insert a new user record into the database with a hashed password.
 */
export async function createUser(data: SignupDTO): Promise<SafeUser> {
    const password_hash = await hashPassword(data.password);

    const user = await db
        .insertInto("users")
        .values({
            username: data.username,
            email: data.email.toLowerCase().trim(),
            password_hash
        })
        .returning(["id", "username", "email", "created_at"])
        .executeTakeFirstOrThrow();

    return user as SafeUser;
}

/**
 * Retrieve a full user record (including password_hash) by email address.
 */
export async function findUserByEmail(email: string): Promise<User | undefined> {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("email", "=", email.toLowerCase().trim())
        .executeTakeFirst();

    return user as User | undefined;
}

/**
 * Retrieve a safe user record by ID (omits password_hash).
 */
export async function findUserById(id: number): Promise<SafeUser | undefined> {
    const user = await db
        .selectFrom("users")
        .select(["id", "username", "email", "created_at"])
        .where("id", "=", id)
        .executeTakeFirst();

    return user as SafeUser | undefined;
}
