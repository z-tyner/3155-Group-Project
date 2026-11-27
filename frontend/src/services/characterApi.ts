/**
 * @file characterApi.ts
 * @description API service methods for character CRUD actions and sprite querying.
 */

import { apiRequest } from "./api.js";
import type { Character, CreateCharacterData, UpdateCharacterData } from "../types/character.js";

export interface CharacterFilterParams {
    preset?: boolean;
    user_id?: number;
}

export async function getAllCharacters(filter?: CharacterFilterParams): Promise<Character[]> {
    const params: Record<string, string | number | undefined> = {};
    if (filter?.preset !== undefined) params.preset = filter.preset ? "true" : "false";
    if (filter?.user_id !== undefined) params.user_id = filter.user_id;

    return await apiRequest<Character[]>("/characters", { params });
}

export async function getCharacterById(id: number): Promise<Character> {
    return await apiRequest<Character>(`/characters/${id}`);
}

export async function createCharacter(data: CreateCharacterData): Promise<Character> {
    return await apiRequest<Character>("/characters", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateCharacter(id: number, data: UpdateCharacterData): Promise<Character> {
    return await apiRequest<Character>(`/characters/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteCharacter(id: number): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>(`/characters/${id}`, {
        method: "DELETE",
    });
}
