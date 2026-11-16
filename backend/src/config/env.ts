/**
 * @file env.ts
 * @description Centralized environment variable loader and validator ensuring required server secrets and configurations are present.
 */
import dotenv from 'dotenv';

// Secrets like GROQ_API_KEY go in .env.local (git-ignored) so they never end up in the public repo.
// Loaded first, so its values win over the shared .env.
dotenv.config({ path: '.env.local' });
dotenv.config();


function required(name: string): string {
    const value = process.env[name];
    if(!value){
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const env = {
    DATABASE_URL: required('DATABASE_URL'),
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-3155-group-project',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};