/**
 * @file characterService.ts
 * @description Manages business logic for creating, retrieving, updating, and deleting playable characters.
 */

import { db } from "../config/db.js";
import type { CreateCharacterInput, UpdateCharacterInput } from "../types/character.js";

export interface CreateCharacterData extends CreateCharacterInput {
    user_id: number | null;
}

export interface CharacterFilter {
    userId?: number;
    presetOnly?: boolean;
}

// Create a new character (custom or preset)
export async function createCharacter(data: CreateCharacterData) {
    const character = await db
        .insertInto("characters")
        .values({
            user_id: data.user_id,
            title: data.title,
            hp: data.hp,
            attack: data.attack,
            defense: data.defense,
            crit_chance: data.crit_chance,
            armor_piercing: data.armor_piercing,
            is_preset: data.is_preset ?? false,
            sprite_url: data.sprite_url,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    return character;
}

// Retrieve characters, optionally filtering by creator or preset status
export async function getAllCharacters(filter?: CharacterFilter) {
    let query = db.selectFrom("characters").selectAll().orderBy("created_at", "desc");

    if (filter?.presetOnly) {
        query = query.where("is_preset", "=", true);
    } else if (filter?.userId !== undefined) {
        query = query.where("user_id", "=", filter.userId);
    }

    return await query.execute();
}

// Retrieve a single character by ID
export async function getCharacterById(characterId: number) {
    const character = await db
        .selectFrom("characters")
        .selectAll()
        .where("id", "=", characterId)
        .executeTakeFirst();

    return character ?? null;
}

// Check if a character exists
export async function characterExists(characterId: number): Promise<boolean> {
    const character = await db
        .selectFrom("characters")
        .select("id")
        .where("id", "=", characterId)
        .executeTakeFirst();

    return character !== undefined;
}

// Update an existing character (only creator can update; preset characters cannot be edited)
export async function updateCharacter(characterId: number, userId: number, data: UpdateCharacterInput) {
    const character = await db
        .updateTable("characters")
        .set(data)
        .where("id", "=", characterId)
        .where("user_id", "=", userId)
        .where("is_preset", "=", false)
        .returningAll()
        .executeTakeFirst();

    return character ?? null;
}

// Delete an existing character (only creator can delete; preset characters cannot be deleted)
export async function deleteCharacter(characterId: number, userId: number): Promise<boolean> {
    const deleted = await db
        .deleteFrom("characters")
        .where("id", "=", characterId)
        .where("user_id", "=", userId)
        .where("is_preset", "=", false)
        .returning("id")
        .executeTakeFirst();

    return deleted !== undefined;
}
