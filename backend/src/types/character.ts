/**
 * @file character.ts
 * @description TypeScript interface definitions for playable Character templates, base combat stats, sprite metadata, and author relationship.
 */

export interface Character {
    id: number;
    user_id: number | null;
    title: string;
    hp: number;
    attack: number;
    defense: number;
    crit_chance: number;
    armor_piercing: boolean;
    is_preset: boolean;
    sprite_url: string;
    created_at: Date;
}

export interface CreateCharacterInput {
    title: string;
    hp: number;
    attack: number;
    defense: number;
    crit_chance: number;
    armor_piercing: boolean;
    sprite_url: string;
    is_preset?: boolean;
}

export interface UpdateCharacterInput {
    title?: string;
    hp?: number;
    attack?: number;
    defense?: number;
    crit_chance?: number;
    armor_piercing?: boolean;
    sprite_url?: string;
}
