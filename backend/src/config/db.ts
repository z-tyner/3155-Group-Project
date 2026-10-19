/**
 * @file db.ts
 * @description PostgreSQL database client and connection pool initialization using `pg` (node-postgres).
 */
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from './env.js';

export const db = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: new pg.Pool({connectionString : env.DATABASE_URL}),

    })
});