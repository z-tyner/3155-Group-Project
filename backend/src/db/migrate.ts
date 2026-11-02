/**
 * @file migrate.ts
 * @description Runs Kysely database migrations for the PostgreSQL database.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL } from 'node:url';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import {db} from '../config/db.js';


// Loads every .ts/.js file in the migrations folder. Used instead of Kysely's
// FileMigrationProvider because that passes raw paths to import(), which fails
// on Windows (C:\...). Paths are converted to file:// URLs first.
class MigrationFolderProvider implements MigrationProvider {
    constructor(private folder: string) {}

    async getMigrations(): Promise<Record<string, Migration>> {
        const migrations: Record<string, Migration> = {};
        const files = await fs.readdir(this.folder);

        for (const file of files) {
            if (!/\.(ts|js)$/.test(file) || file.endsWith('.d.ts')) continue;

            const migration = await import(pathToFileURL(path.join(this.folder, file)).href);
            // Name is the file name without extension, e.g. "0001-init"
            migrations[file.replace(/\.(ts|js)$/, '')] = migration;
        }

        return migrations;
    }
}

async function main() {
    const direction = process.argv[2] ?? 'latest';
    if (direction !== 'latest' && direction !== 'down'){
        console.error(`Unknown directioin "${direction}". Use "latest" or "down".`);
        process.exit(1);
    }

    const migrator = new Migrator({
        db,
        provider: new MigrationFolderProvider(
            path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
        ),
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