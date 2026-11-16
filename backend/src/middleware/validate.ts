/**
 * @file validate.ts
 * @description Request schema validation middleware ensuring incoming request bodies, params, and queries conform to expected schemas.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

// Supported request locations
type RequestLocation = "body" | "params" | "query";

// Validation function that returns an error message or null
export type ValidationSchema = (
    data: unknown
) => string | null;

/**
 * Creates middleware that validates a selected part of a request.
 *
 * @param schema - Function that validates the supplied data.
 * @param location - Request property to validate.
 * @returns Express request validation middleware.
 */
export function validate(
    schema: ValidationSchema,
    location: RequestLocation = "body"
): RequestHandler {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        const data = req[location];

        const error = schema(data);

        if (error !== null) {
            res.status(400).json({
                message: error
            });
            return;
        }

        next();
    };
}

/**
 * Checks whether a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Checks whether a value is a positive integer.
 */
export function isPositiveInteger(value: unknown): boolean {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
    );
}