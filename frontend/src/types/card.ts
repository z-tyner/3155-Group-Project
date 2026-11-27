/**
 * @file card.ts
 * @description Frontend TypeScript types for power-up Cards, effect categories (damage, shield, speed, heal), modifier values, and card art.
 */

export const EFFECT_TYPES = ["damage", "shield", "speed", "heal"] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

export interface Card {
    id: number;
    user_id: number | null;
    title: string;
    description: string;
    effect_type: EffectType;
    value: number;
    image_url: string;
    created_at: string;
}

export interface DraftedCard extends Card {
    quantity: number;
}

export interface CreateCardData {
    title: string;
    description: string;
    effect_type: EffectType;
    value: number;
    image_url: string;
}
