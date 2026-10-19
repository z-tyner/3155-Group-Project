/**
 * @file env.ts
 * @description Centralized environment variable loader and validator ensuring required server secrets and configurations are present.
 */
import 'dotenv/config';


function required(name: string): string {
    const value = process.env[name];
    if(!value){
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const env = {
    DATABASE_URL: required('DATABASE_URL'),
};