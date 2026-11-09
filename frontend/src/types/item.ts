/**
 * @file item.ts
 * @description Frontend TypeScript types for in-game consumable items, item drop rates, and inventory entries used during turn-based combat.
 */

export interface Item {
    id: number;
    name: string;
    description: string;
    effect_type: "heal" | "buff" | "damage" | "shield";
    value: number;
    rarity: "common" | "uncommon" | "rare" | "legendary";
    icon_url?: string;
}

export interface InventoryItem {
    item: Item;
    quantity: number;
}
