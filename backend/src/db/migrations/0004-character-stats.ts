/**
 * @file 0004-character-stats.ts
 * @description Updates the characters table schema to align with combat stats:
 * - Renames attack_power to attack and health to hp
 * - Drops speed
 * - Adds defense, crit_chance, armor_piercing trait, and is_preset flag
 * - Makes user_id nullable for built-in preset characters
 */

import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    // Make user_id nullable so preset characters can exist without being tied to a user account
    await sql`ALTER TABLE characters ALTER COLUMN user_id DROP NOT NULL`.execute(db);

    // Rename existing columns to agreed naming convention
    await sql`ALTER TABLE characters RENAME COLUMN attack_power TO attack`.execute(db);
    await sql`ALTER TABLE characters RENAME COLUMN health TO hp`.execute(db);

    // Remove speed column
    await sql`ALTER TABLE characters DROP COLUMN IF EXISTS speed`.execute(db);

    // Add new combat stats and preset flag
    await sql`ALTER TABLE characters ADD COLUMN defense double precision NOT NULL DEFAULT 0`.execute(db);
    await sql`ALTER TABLE characters ADD COLUMN crit_chance double precision NOT NULL DEFAULT 0`.execute(db);
    await sql`ALTER TABLE characters ADD COLUMN armor_piercing boolean NOT NULL DEFAULT false`.execute(db);
    await sql`ALTER TABLE characters ADD COLUMN is_preset boolean NOT NULL DEFAULT false`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    // Revert new columns
    await sql`ALTER TABLE characters DROP COLUMN IF EXISTS is_preset`.execute(db);
    await sql`ALTER TABLE characters DROP COLUMN IF EXISTS armor_piercing`.execute(db);
    await sql`ALTER TABLE characters DROP COLUMN IF EXISTS crit_chance`.execute(db);
    await sql`ALTER TABLE characters DROP COLUMN IF EXISTS defense`.execute(db);

    // Restore speed column
    await sql`ALTER TABLE characters ADD COLUMN speed integer NOT NULL DEFAULT 5`.execute(db);

    // Revert column names
    await sql`ALTER TABLE characters RENAME COLUMN hp TO health`.execute(db);
    await sql`ALTER TABLE characters RENAME COLUMN attack TO attack_power`.execute(db);

    // Restore not null constraint on user_id
    await sql`ALTER TABLE characters ALTER COLUMN user_id SET NOT NULL`.execute(db);
}
