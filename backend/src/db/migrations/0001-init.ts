import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('users')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('username', 'text', (col) => col.notNull())
        .addColumn('email', 'text', (col) => col.notNull())
        .addColumn('password_hash', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull(),
        )
        .execute();

    await db.schema
        .createTable('characters')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('user_id', 'integer', (col) => col.references('users.id'))
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('health', 'integer', (col) => col.notNull())
        .addColumn('speed', 'integer', (col) => col.notNull())
        .addColumn('attack_power', 'double precision', (col) => col.notNull())
        .addColumn('sprite_url', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull(),
        )
        .execute();

    await db.schema
        .createTable('cards')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('user_id', 'integer', (col) => col.references('users.id'))
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('description', 'text', (col) => col.notNull())
        .addColumn('effect_type', 'text', (col) => col.notNull())
        .addColumn('value', 'text', (col) => col.notNull())
        .addColumn('image_url', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull(),
        )
        .execute();

    await db.schema
        .createTable('runs')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('user_id', 'integer', (col) => col.references('users.id'))
        .addColumn('character_id', 'integer', (col) => col.references('users.id'))
        .addColumn('score', 'double precision', (col) => col.notNull())
        .addColumn('level_reached', 'text', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull(),
        )
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('users').execute();
    await db.schema.dropTable('characters').execute();
    await db.schema.dropTable('cards').execute();
    await db.schema.dropTable('runs').execute();
}
