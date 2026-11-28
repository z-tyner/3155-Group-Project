/**
 * @file auth.ts
 * @description Authentication middleware that verifies JWT bearer tokens in incoming request headers and attaches the authenticated user to the request.
 */

import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService.js";

/**
 * Express middleware to require and verify a valid JWT Bearer token.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    // Allow test-harness injected user in test environment
    if (process.env.NODE_ENV === "test" && req.user) {
        next();
        return;
    }

    const authHeader = req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authentication token required." });
        return;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
        res.status(401).json({ message: "Authentication token required." });
        return;
    }

    try {
        const payload = authService.verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired authentication token." });
    }
}
