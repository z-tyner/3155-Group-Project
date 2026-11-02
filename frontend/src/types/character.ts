/**
 * @file character.ts
 * @description Frontend TypeScript types for playable Character templates, combat stats (HP, Attack, Defense, Crit Chance, Armor Piercing), and creator metadata.
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
    created_at: string;
}

export interface CreateCharacterData {
    title: string;
    hp: number;
    attack: number;
    defense: number;
    crit_chance: number;
    armor_piercing: boolean;
    sprite_url: string;
}

export interface UpdateCharacterData {
    title?: string;
    hp?: number;
    attack?: number;
    defense?: number;
    crit_chance?: number;
    armor_piercing?: boolean;
    sprite_url?: string;
}
