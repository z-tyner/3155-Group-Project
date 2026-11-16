/**
 * @file userService.ts
 * @description Database operations for managing user profiles.
 */

import { db } from "../config/db.js";

/**
 * Retrieves a user's public profile by ID.
 */
export async function getUserById(id: number) {
    return await db
        .selectFrom("users")
        .select(["id", "username", "created_at"])
        .where("id", "=", id)
        .executeTakeFirst();
}

/**
 * Deletes a user and their associated content.
 * All operations are performed within a transaction.
 */
export async function deleteUser(userId: number): Promise<boolean> {
    return await db.transaction().execute(async (trx) => {
        // Find and lock the user
        const user = await trx
            .selectFrom("users")
            .select("id")
            .where("id", "=", userId)
            .forUpdate()
            .executeTakeFirst();

        if (!user) {
            return false;
        }

        // Find posts created by the user
        const posts = await trx
            .selectFrom("posts")
            .select("id")
            .where("user_id", "=", userId)
            .execute();

        const postIds = posts.map((post) => post.id);

        // Delete all comments attached to the user's posts
        if (postIds.length > 0) {
            await trx
                .deleteFrom("comments")
                .where("post_id", "in", postIds)
                .execute();
        }

        // Delete comments created by the user
        await trx
            .deleteFrom("comments")
            .where("user_id", "=", userId)
            .execute();

        // Delete posts created by the user
        await trx
            .deleteFrom("posts")
            .where("user_id", "=", userId)
            .execute();

        // Find cards created by the user
        const cards = await trx
            .selectFrom("cards")
            .select("id")
            .where("user_id", "=", userId)
            .execute();

        const cardIds = cards.map((card) => card.id);

        // Remove references to the user's cards from all runs
        if (cardIds.length > 0) {
            await trx
                .deleteFrom("run_cards")
                .where("card_id", "in", cardIds)
                .execute();
        }

        // Delete the user's runs.
        // Related run_cards are deleted automatically.
        await trx
            .deleteFrom("runs")
            .where("user_id", "=", userId)
            .execute();

        // Delete the user's cards
        await trx
            .deleteFrom("cards")
            .where("user_id", "=", userId)
            .execute();

        // Delete the user's characters
        await trx
            .deleteFrom("characters")
            .where("user_id", "=", userId)
            .execute();

        // Delete the user's account
        await trx
            .deleteFrom("users")
            .where("id", "=", userId)
            .execute();

        return true;
    });
}