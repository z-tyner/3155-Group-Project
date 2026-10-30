/**
 * @file 0002-forum.ts
 * @description Creates the posts and comments tables for the forum.
 */

import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    // Create posts table
    await db.schema
        .createTable("posts")
        .addColumn("id", "serial", (col) => col.primaryKey())
        .addColumn("user_id", "integer", (col) => col.references("users.id").notNull())
        .addColumn("title", "text", (col) => col.notNull())
        .addColumn("content", "text", (col) => col.notNull())
        .addColumn("created_at", "timestamp", (col) =>col.defaultTo(sql`now()`).notNull())
        .addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`now()`).notNull())
        .execute();
    
    // Create comments table
    await db.schema
        .createTable("comments")
        .addColumn("id", "serial", (col) => col.primaryKey())
        .addColumn("user_id", "integer", (col) => col.references("users.id").notNull())
        .addColumn("post_id", "integer", (col) => col.references("posts.id").notNull())
        .addColumn("content", "text", (col) => col.notNull())
        .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`now()`).notNull())
        .addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`now()`).notNull())
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop comments first because they reference posts
  await db.schema.dropTable("comments").execute();
  await db.schema.dropTable("posts").execute();
}
