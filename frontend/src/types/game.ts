/**
 * @file game.ts
 * @description Frontend TypeScript types for game run session state, stages, battle states, player acquired actions, enemy combatants, and turn results.
 */

import { CombatAction } from "./action.js";
export type { Item, InventoryItem } from "./item.js";
import { InventoryItem } from "./item.js";
import { Card, DraftedCard } from "./card.js";
import { Character } from "./character.js";

export interface Run {
    id: number;
    user_id: number;
    character_id: number | null;
    score: number;
    level_reached: number;
    created_at: string;
    completed_at: string | null;
    character_title?: string | null;
    character_sprite?: string | null;
    character_hp?: number | null;
    character_attack?: number | null;
    character_defense?: number | null;
}

export interface RunWithCards extends Run {
    cards: DraftedCard[];
}

export interface JourneyMultipliers {
    xpMultiplier: number;
    damageMultiplier: number;
    lootMultiplier: number;
}

export interface JourneyStatBonuses {
    hpBonus: number;
    attackBonus: number;
    defenseBonus: number;
    critBonus: number;
}

export type EnemySpawnRate = "low" | "normal" | "swarm" | "horde";

export interface JourneyConfig {
    selectedCharacterId: number | null;
    cheatsEnabled: boolean;
    includedCustomCardIds: number[];
    multipliers: JourneyMultipliers;
    statBonuses: JourneyStatBonuses;
    enemySpawnRate: EnemySpawnRate;
}

export const DEFAULT_JOURNEY_CONFIG: JourneyConfig = {
    selectedCharacterId: null,
    cheatsEnabled: false,
    includedCustomCardIds: [],
    multipliers: {
        xpMultiplier: 1.0,
        damageMultiplier: 1.0,
        lootMultiplier: 1.0,
    },
    statBonuses: {
        hpBonus: 0,
        attackBonus: 0,
        defenseBonus: 0,
        critBonus: 0,
    },
    enemySpawnRate: "normal",
};

export interface PlayerBattleState {
    characterId: number;
    title: string;
    currentHp: number;
    maxHp: number;
    attack: number;
    defense: number;
    crit_chance: number;
    armor_piercing: boolean;
    luck: number;
    speed: boolean; // Determines first turn initiative
    acquiredActions: CombatAction[]; // List of combat actions available to choose from
    activeShield: number; // Flat incoming damage mitigation for the current/next turn
}

export interface EnemyBattleState {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    attack: number;
    defense: number;
    crit_chance: number;
    armor_piercing: boolean;
    accuracy: number;
    itemDropChance: number;
    xpDropAmount: number;
    isBoss: boolean;
    spriteUrl: string;
}

export interface CombatTurnResult {
    actorName: string;
    actionName: string;
    category: "offensive" | "defensive" | "item";
    targetName?: string;
    hit: boolean;
    crit: boolean;
    damageDealt: number;
    shieldApplied: number;
    targetDefeated: boolean;
    logMessage: string;
}

export interface BattleSessionState {
    stage: number;
    wave: number;
    player: PlayerBattleState;
    enemies: EnemyBattleState[];
    activeTurn: "player" | "enemy";
    inventory: InventoryItem[];
    turnLogs: CombatTurnResult[];
    selectedAction?: CombatAction;
    selectedTargetId?: string;
    isStageCleared: boolean;
    isGameOver: boolean;
}
