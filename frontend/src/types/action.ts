/**
 * @file action.ts
 * @description Frontend TypeScript types and interfaces for combat actions, attack categories, targeting rules, level completion unlock tables, and standard action presets.
 */

export type ActionCategory = "offensive" | "defensive" | "buff";
export type TargetType = "single_enemy" | "all_enemies" | "self";
export type ActionSource = "innate" | "level_reward" | "card";

export interface CombatAction {
    id: string;
    name: string;
    description: string;
    category: ActionCategory;
    targetType: TargetType;
    basePower?: number; // Base attack multiplier or flat damage
    accuracy: number; // 0-100 hit chance percentage
    armorPiercing?: boolean; // Bypasses enemy defense reduction formula
    critChanceBonus?: number; // Added to player's base critical hit %
    shieldAmount?: number; // Flat damage mitigation buffer for the next turn
    source: ActionSource; // Innate character action, unlocked via level completion, or acquired from power-up card
    unlockLevel?: number; // The level completion that rewards this action (e.g., 1, 6, 8, etc.)
}

/**
 * Standard innate combat actions available to characters by default at the start of a run.
 */
export const DEFAULT_COMBAT_ACTIONS: CombatAction[] = [
    {
        id: "action_strike",
        name: "Strike",
        description: "A straightforward physical blow dealing damage based on your Attack stat.",
        category: "offensive",
        targetType: "single_enemy",
        basePower: 1.0,
        accuracy: 95,
        armorPiercing: false,
        source: "innate"
    },
    {
        id: "action_shield",
        name: "Guard",
        description: "Raise a defensive shield mitigating incoming damage on the next enemy turn.",
        category: "defensive",
        targetType: "self",
        shieldAmount: 15,
        accuracy: 100,
        source: "innate"
    },
    {
        id: "action_piercing_thrust",
        name: "Piercing Thrust",
        description: "A precise thrust that bypasses enemy armor and defense mitigation.",
        category: "offensive",
        targetType: "single_enemy",
        basePower: 0.85,
        accuracy: 90,
        armorPiercing: true,
        source: "innate"
    }
];

/**
 * Easily specifiable registry of new attacks/combat actions awarded after completing specific levels.
 * To add or modify level rewards, configure the entry below with the desired `unlockLevel`.
 */
export const LEVEL_REWARD_ACTIONS: CombatAction[] = [
    {
        id: "action_power_strike",
        name: "Power Strike",
        description: "A heavy, concentrated swing dealing 1.4x attack damage.",
        category: "offensive",
        targetType: "single_enemy",
        basePower: 1.4,
        accuracy: 85,
        armorPiercing: false,
        source: "level_reward",
        unlockLevel: 1 // Awarded after completing Level 1
    },
    {
        id: "action_iron_barrier",
        name: "Iron Barrier",
        description: "A fortified stance granting a massive 35 shield mitigation for the next turn.",
        category: "defensive",
        targetType: "self",
        shieldAmount: 35,
        accuracy: 100,
        source: "level_reward",
        unlockLevel: 6 // Awarded after completing Level 6
    },
    {
        id: "action_cataclysm_slash",
        name: "Cataclysm Slash",
        description: "A devastating strike dealing 2.0x true damage that ignores all enemy defense.",
        category: "offensive",
        targetType: "single_enemy",
        basePower: 2.0,
        accuracy: 90,
        armorPiercing: true,
        critChanceBonus: 15,
        source: "level_reward",
        unlockLevel: 8 // Awarded after completing Level 8
    }
];

/**
 * Retrieve all combat actions unlocked upon completing a given level.
 *
 * @param completedLevel - The level number just cleared by the player.
 * @returns Array of CombatActions configured for this level completion.
 */
export function getActionsUnlockedAtLevel(completedLevel: number): CombatAction[] {
    return LEVEL_REWARD_ACTIONS.filter((action) => action.unlockLevel === completedLevel);
}
