/**
 * @file characterController.ts
 * @description Controller implementing full CRUD operations for playable character templates, base stat persistence, and custom sprite image uploads.
 */

import type { Request, Response, NextFunction } from "express";
import * as characterService from "../services/characterService.js";
import type { UpdateCharacterInput } from "../types/character.js";

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

function isValidHp(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidStat(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isValidBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

// Postgres foreign key violation: the character is referenced by a run
function isForeignKeyViolation(error: unknown): boolean {
    return (error as { code?: string })?.code === "23503";
}

// Create a new custom character
export async function createCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const body = req.body ?? {};
        const title = body.title;
        const hp = body.hp ?? body.health;
        const attack = body.attack ?? body.attack_power;
        const defense = body.defense ?? body.defence;
        const critChance = body.crit_chance ?? body.critical_hit_percentage;
        const armorPiercing = body.armor_piercing;
        const spriteUrl = body.sprite_url;

        if (!isNonEmptyString(title)) {
            res.status(400).json({ message: "Title is required." });
            return;
        }

        if (!isValidHp(hp)) {
            res.status(400).json({ message: "HP must be a positive number." });
            return;
        }

        if (!isValidStat(attack)) {
            res.status(400).json({ message: "Attack must be a valid number." });
            return;
        }

        if (!isValidStat(defense)) {
            res.status(400).json({ message: "Defense must be a valid number." });
            return;
        }

        if (!isValidStat(critChance)) {
            res.status(400).json({ message: "crit_chance must be a valid number." });
            return;
        }

        if (!isValidBoolean(armorPiercing)) {
            res.status(400).json({ message: "armor_piercing must be a boolean." });
            return;
        }

        if (!isNonEmptyString(spriteUrl)) {
            res.status(400).json({ message: "sprite_url is required." });
            return;
        }

        const character = await characterService.createCharacter({
            user_id: userId,
            title: title.trim(),
            hp,
            attack,
            defense,
            crit_chance: critChance,
            armor_piercing: armorPiercing,
            sprite_url: spriteUrl.trim(),
            is_preset: false,
        });

        res.status(201).json(character);
    } catch (error) {
        next(error);
    }
}

// Retrieve all characters (support ?preset=true and ?user_id=)
export async function getAllCharacters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let userId: number | undefined;
        let presetOnly = false;

        if (req.query.preset === "true" || req.query.is_preset === "true") {
            presetOnly = true;
        }

        if (req.query.user_id !== undefined) {
            const parsed = parseId(req.query.user_id);

            if (parsed === null) {
                res.status(400).json({ message: "Invalid user ID." });
                return;
            }

            userId = parsed;
        }

        const characters = await characterService.getAllCharacters({ userId, presetOnly });
        res.status(200).json(characters);
    } catch (error) {
        next(error);
    }
}

// Retrieve a single character by ID
export async function getCharacterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const characterId = parseId(req.params.id);

        if (characterId === null) {
            res.status(400).json({ message: "Invalid character ID." });
            return;
        }

        const character = await characterService.getCharacterById(characterId);

        if (!character) {
            res.status(404).json({ message: "Character not found." });
            return;
        }

        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
}

// Update an existing character (creator only, presets cannot be modified)
export async function updateCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const characterId = parseId(req.params.id);

        if (characterId === null) {
            res.status(400).json({ message: "Invalid character ID." });
            return;
        }

        // Fetch character to verify ownership and ensure it's not a preset
        const existing = await characterService.getCharacterById(characterId);

        if (!existing || existing.user_id !== userId) {
            res.status(404).json({ message: "Character not found or access denied." });
            return;
        }

        if (existing.is_preset) {
            res.status(403).json({ message: "Preset characters cannot be modified." });
            return;
        }

        const body = req.body ?? {};
        const data: UpdateCharacterInput = {};

        if (body.title !== undefined) {
            if (!isNonEmptyString(body.title)) {
                res.status(400).json({ message: "Title cannot be empty." });
                return;
            }
            data.title = body.title.trim();
        }

        const hp = body.hp ?? body.health;
        if (hp !== undefined) {
            if (!isValidHp(hp)) {
                res.status(400).json({ message: "HP must be a positive number." });
                return;
            }
            data.hp = hp;
        }

        const attack = body.attack ?? body.attack_power;
        if (attack !== undefined) {
            if (!isValidStat(attack)) {
                res.status(400).json({ message: "Attack must be a valid number." });
                return;
            }
            data.attack = attack;
        }

        const defense = body.defense ?? body.defence;
        if (defense !== undefined) {
            if (!isValidStat(defense)) {
                res.status(400).json({ message: "Defense must be a valid number." });
                return;
            }
            data.defense = defense;
        }

        const critChance = body.crit_chance ?? body.critical_hit_percentage;
        if (critChance !== undefined) {
            if (!isValidStat(critChance)) {
                res.status(400).json({ message: "crit_chance must be a valid number." });
                return;
            }
            data.crit_chance = critChance;
        }

        if (body.armor_piercing !== undefined) {
            if (!isValidBoolean(body.armor_piercing)) {
                res.status(400).json({ message: "armor_piercing must be a boolean." });
                return;
            }
            data.armor_piercing = body.armor_piercing;
        }

        if (body.sprite_url !== undefined) {
            if (!isNonEmptyString(body.sprite_url)) {
                res.status(400).json({ message: "sprite_url cannot be empty." });
                return;
            }
            data.sprite_url = body.sprite_url.trim();
        }

        if (Object.keys(data).length === 0) {
            res.status(400).json({ message: "Provide at least one field to update." });
            return;
        }

        const updated = await characterService.updateCharacter(characterId, userId, data);

        if (!updated) {
            res.status(404).json({ message: "Character not found or access denied." });
            return;
        }

        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
}

// Delete an existing character (creator only, presets cannot be deleted)
export async function deleteCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = getAuthenticatedUserId(req);

        if (userId === null) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        const characterId = parseId(req.params.id);

        if (characterId === null) {
            res.status(400).json({ message: "Invalid character ID." });
            return;
        }

        const existing = await characterService.getCharacterById(characterId);

        if (!existing || existing.user_id !== userId) {
            res.status(404).json({ message: "Character not found or access denied." });
            return;
        }

        if (existing.is_preset) {
            res.status(403).json({ message: "Preset characters cannot be deleted." });
            return;
        }

        const deleted = await characterService.deleteCharacter(characterId, userId);

        if (!deleted) {
            res.status(404).json({ message: "Character not found or access denied." });
            return;
        }

        res.status(204).send();
    } catch (error) {
        if (isForeignKeyViolation(error)) {
            res.status(409).json({ message: "Character has been used in a run and cannot be deleted." });
            return;
        }
        next(error);
    }
}
