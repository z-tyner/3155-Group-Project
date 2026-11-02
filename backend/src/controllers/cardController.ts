/**
 * @file cardController.ts
 * @description Controller implementing full CRUD operations for power-up cards, effect values, card artwork uploads to S3, and public card listing.
 */

import type { Request, Response, NextFunction } from "express";
import * as cardService from "../services/cardService.js";
import { EFFECT_TYPES, type EffectType } from "../types/card.js";

// Limits for card stat values and draft pool size
const MAX_EFFECT_VALUE = 1000;
const DEFAULT_DRAFT_COUNT = 3;
const MAX_DRAFT_COUNT = 10;

// Get the authenticated user's ID from the request.
// Authentication middleware must verify the JWT and set req.user.id.
function getAuthenticatedUserId(req: Request): number | null {
    const user = (req as Request & { user?: { id: number } }).user;

    return typeof user?.id === "number" && Number.isInteger(user.id) && user.id > 0
        ? user.id
        : null;
}

// Validate positive integer IDs from route parameters / query strings
function parseId(value: unknown): number | null {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return null;
    }

    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isEffectType(value: unknown): value is EffectType {
    return typeof value === "string" && (EFFECT_TYPES as readonly string[]).includes(value);
}

function isValidEffectValue(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_EFFECT_VALUE;
}

// Postgres foreign key violation: the card is referenced by a run
function isForeignKeyViolation(error: unknown): boolean {
    return (error as { code?: string })?.code === "23503";
}

// Create a new card
export async function createCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const { title, description, effect_type, value, image_url } = req.body ?? {};

        if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
            res.status(400).json({ message: "Title and description are required." });
            return;
        }

        if (!isEffectType(effect_type)) {
            res.status(400).json({ message: `effect_type must be one of: ${EFFECT_TYPES.join(", ")}.` });
            return;
        }

        if (!isValidEffectValue(value)) {
            res.status(400).json({ message: `value must be a number between -${MAX_EFFECT_VALUE} and ${MAX_EFFECT_VALUE}.` });
            return;
        }

        // TODO: switch to multipart upload once upload.ts / s3Service.ts are implemented
        if (!isNonEmptyString(image_url)) {
            res.status(400).json({ message: "image_url is required." });
            return;
        }

        const card = await cardService.createCard({
            user_id: userId,
            title: title.trim(),
            description: description.trim(),
            effect_type,
            value,
            image_url: image_url.trim(),
        });

        res.status(201).json(card);
    } catch (error) {
        next(error);
    }
}

// Retrieve all cards. Optional ?user_id= filters to one creator's cards.
export async function getAllCards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let userId: number | undefined;

        if (req.query.user_id !== undefined) {
            const parsed = parseId(req.query.user_id);

            if (parsed === null) {
                res.status(400).json({ message: "Invalid user ID." });
                return;
            }

            userId = parsed;
        }

        const cards = await cardService.getAllCards(userId);
        res.status(200).json(cards);
    } catch (error) {
        next(error);
    }
}

// Retrieve random cards to offer after a stage clear. Optional ?count= (default 3).
export async function getDraftPool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let count = DEFAULT_DRAFT_COUNT;

        if (req.query.count !== undefined) {
            const parsed = parseId(req.query.count);

            if (parsed === null || parsed > MAX_DRAFT_COUNT) {
                res.status(400).json({ message: `count must be between 1 and ${MAX_DRAFT_COUNT}.` });
                return;
            }

            count = parsed;
        }

        const cards = await cardService.getDraftPool(count);
        res.status(200).json(cards);
    } catch (error) {
        next(error);
    }
}

// Retrieve a single card
export async function getCardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const cardId = parseId(req.params.id);

        if (cardId === null) {
            res.status(400).json({ message: "Invalid card ID." });
            return;
        }

        const card = await cardService.getCardById(cardId);

        if (!card) {
            res.status(404).json({ message: "Card not found." });
            return;
        }

        res.status(200).json(card);
    } catch (error) {
        next(error);
    }
}

// Update an existing card
export async function updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const cardId = parseId(req.params.id);

        if (cardId === null) {
            res.status(400).json({ message: "Invalid card ID." });
            return;
        }

        const { title, description, effect_type, value, image_url } = req.body ?? {};
        const data: cardService.UpdateCardData = {};

        if (title !== undefined) {
            if (!isNonEmptyString(title)) {
                res.status(400).json({ message: "Title cannot be empty." });
                return;
            }
            data.title = title.trim();
        }

        if (description !== undefined) {
            if (!isNonEmptyString(description)) {
                res.status(400).json({ message: "Description cannot be empty." });
                return;
            }
            data.description = description.trim();
        }

        if (effect_type !== undefined) {
            if (!isEffectType(effect_type)) {
                res.status(400).json({ message: `effect_type must be one of: ${EFFECT_TYPES.join(", ")}.` });
                return;
            }
            data.effect_type = effect_type;
        }

        if (value !== undefined) {
            if (!isValidEffectValue(value)) {
                res.status(400).json({ message: `value must be a number between -${MAX_EFFECT_VALUE} and ${MAX_EFFECT_VALUE}.` });
                return;
            }
            data.value = value;
        }

        if (image_url !== undefined) {
            if (!isNonEmptyString(image_url)) {
                res.status(400).json({ message: "image_url cannot be empty." });
                return;
            }
            data.image_url = image_url.trim();
        }

        if (Object.keys(data).length === 0) {
            res.status(400).json({ message: "Provide at least one field to update." });
            return;
        }

        const card = await cardService.updateCard(cardId, userId, data);

        if (!card) {
            res.status(404).json({ message: "Card not found or access denied." });
            return;
        }

        res.status(200).json(card);
    } catch (error) {
        next(error);
    }
}

// Delete an existing card
export async function deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const cardId = parseId(req.params.id);

        if (cardId === null) {
            res.status(400).json({ message: "Invalid card ID." });
            return;
        }

        const deleted = await cardService.deleteCard(cardId, userId);

        if (!deleted) {
            res.status(404).json({ message: "Card not found or access denied." });
            return;
        }

        res.status(204).send();
    } catch (error) {
        if (isForeignKeyViolation(error)) {
            res.status(409).json({ message: "Card has been drafted in a run and cannot be deleted." });
            return;
        }
        next(error);
    }
}
