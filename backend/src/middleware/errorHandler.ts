/**
 * @file errorHandler.ts
 * @description Centralized Express error-handling middleware that catches unhandled errors, formats API error responses, and prevents crash cascades.
 */

import type { Request, Response, NextFunction } from "express";
import multer from "multer";

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
    
    // Handle Multer upload errors
    if (err instanceof multer.MulterError) {
        res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
            message: err.code === "LIMIT_FILE_SIZE"
                ? "Uploaded file exceeds the 5 MB limit."
                : "Invalid file upload."
        });
        return;
    }

    // Handle invalid image file types
    if (
        err instanceof Error &&
        err.message.startsWith("Invalid file type.")
    ) {
        res.status(400).json({
            message: err.message
        });
        return;
    }

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