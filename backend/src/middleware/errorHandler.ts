/**
 * @file errorHandler.ts
 * @description Centralized Express error-handling middleware that catches unhandled errors, formats API error responses, and prevents crash cascades.
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Handles errors forwarded by controllers and middleware.
 */
export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Delegate errors if the response has already started
    if (res.headersSent) {
        return next(err);
    }

    // Log the error for debugging
    console.error("API Error:", err);

    // Handle PostgreSQL unique constraint violations
    if (isDatabaseError(err, "23505")) {
        res.status(409).json({
            message: "A record with this information already exists."
        });
        return;
    }

    // Handle PostgreSQL foreign key violations
    if (isDatabaseError(err, "23503")) {
        res.status(409).json({
            message: "This operation violates a related record constraint."
        });
        return;
    }

    // Handle unexpected errors
    res.status(500).json({
        message: "An unexpected server error occurred."
    });
}

/**
 * Checks whether an error matches a PostgreSQL error code.
 */
function isDatabaseError(error: unknown, code: string): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code
    );
}