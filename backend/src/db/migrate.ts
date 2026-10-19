/**
 * @file migrate.ts
 * @description Database migration utility script that reads and executes schema.sql against the target PostgreSQL instance.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {fileURLToPath } from 'node:url';
import {FileMigrationProvider, Migrator } from 'kysely/migration';
import {db} from '../config/db.js';


async function main() {
    const direction = process.argv[2] ?? 'latest';
    if (direction !== 'latest' && direction !== 'down'){
        console.error(`Unknown directioin "${direction}". Use "latest" or "down".`);
        process.exit(1);
    }

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(path.dirname(fileURLToPath(import.meta.url)),'migrations'),
        })
    });

    const { error, results } = 
        direction === 'latest' ? await migrator.migrateToLatest() : await migrator.migrateDown();

        for (const r of results ?? []){
            const verb = r.direction === 'Up' ? 'applied' : 'reverted';
            if (r.status === 'Success') console.log(`${verb}: ${r.migrationName}`);
            else if (r.status === 'Error') console.error(`failed: ${r.migrationName}`);
        }
    if (results?.length === 0) console.log('Nothing to do.');


    await db.destroy();

    if (error){
        console.error(error);
        process.exit(1);
    }
}

main();