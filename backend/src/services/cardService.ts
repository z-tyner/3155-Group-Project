/**
 * @file cardService.ts
 * @description Manages business logic for creating, retrieving, updating, and deleting power-up cards.
 */

import { sql } from "kysely";
import { db } from "../config/db.js";
import type { EffectType } from "../types/card.js";

// Data required to create a card
export interface CreateCardData {
    user_id: number;
    title: string;
    description: string;
    effect_type: EffectType;
    value: number;
    image_url: string;
}

// Data that can be changed when editing a card
export interface UpdateCardData {
    title?: string;
    description?: string;
    effect_type?: EffectType;
    value?: number;
    image_url?: string;
}

// Create a new card
export async function createCard(data: CreateCardData) {
    const card = await db
        .insertInto("cards")
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();

    return card;
}

// Retrieve all cards, optionally only the ones a specific user made
export async function getAllCards(userId?: number) {
    let query = db.selectFrom("cards").selectAll().orderBy("created_at", "desc");

    if (userId !== undefined) {
        query = query.where("user_id", "=", userId);
    }

    return await query.execute();
}

// Retrieve a single card by ID
export async function getCardById(cardId: number) {
    const card = await db
        .selectFrom("cards")
        .selectAll()
        .where("id", "=", cardId)
        .executeTakeFirst();

    return card ?? null;
}

// Pick random cards to offer the player after clearing a stage
export async function getDraftPool(count: number) {
    const cards = await db
        .selectFrom("cards")
        .selectAll()
        .orderBy(sql`random()`)
        .limit(count)
        .execute();

    return cards;
}

// Update an existing card (only the card's creator can do this)
export async function updateCard(cardId: number, userId: number, data: UpdateCardData) {
    const card = await db
        .updateTable("cards")
        .set(data)
        .where("id", "=", cardId)
        .where("user_id", "=", userId)
        .returningAll()
        .executeTakeFirst();

    return card ?? null;
}

// Delete an existing card (only the card's creator can do this).
// Throws a foreign key error (code 23503) if the card was drafted in a run.
export async function deleteCard(cardId: number, userId: number) {
    const deletedCard = await db
        .deleteFrom("cards")
        .where("id", "=", cardId)
        .where("user_id", "=", userId)
        .returning("id")
        .executeTakeFirst();

    return deletedCard !== undefined;
}
