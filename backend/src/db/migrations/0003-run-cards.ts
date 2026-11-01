/**
 * @file 0003-run-cards.ts
 * @description Creates the run_cards join table (runs <-> cards, M:N with quantity)
 * and aligns runs.level_reached and cards.value with the ERD numeric types.
 */

import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    // Cards drafted during a run. Deleting a run removes its drafts;
    // deleting a card that has been drafted is blocked so run history stays intact.
    await db.schema
        .createTable("run_cards")
        .addColumn("run_id", "integer", (col) => col.references("runs.id").onDelete("cascade").notNull())
        .addColumn("card_id", "integer", (col) => col.references("cards.id").notNull())
        .addColumn("quantity", "integer", (col) => col.notNull().defaultTo(1).check(sql`quantity > 0`))
        .addPrimaryKeyConstraint("run_cards_pkey", ["run_id", "card_id"])
        .execute();

    // ERD has level_reached as int and value as float; 0001 created both as text.
    // Numeric types are needed so leaderboard sorting and stat math work correctly.
    await sql`ALTER TABLE runs ALTER COLUMN level_reached TYPE integer USING level_reached::integer`.execute(db);
    await sql`ALTER TABLE cards ALTER COLUMN value TYPE double precision USING value::double precision`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`ALTER TABLE cards ALTER COLUMN value TYPE text USING value::text`.execute(db);
    await sql`ALTER TABLE runs ALTER COLUMN level_reached TYPE text USING level_reached::text`.execute(db);
    await db.schema.dropTable("run_cards").execute();
}
