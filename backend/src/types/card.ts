/**
 * @file card.ts
 * @description TypeScript interface definitions for power-up Cards, effect types, numerical stat modifiers, artwork metadata, and author relationship.
 */

// Allowed card effect categories
export const EFFECT_TYPES = ["damage", "shield", "speed", "heal"] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

export interface Card {
    id: number;
    user_id: number;
    title: string;
    description: string;
    effect_type: EffectType;
    value: number;
    image_url: string;
    created_at: Date;
}
