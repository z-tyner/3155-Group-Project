/**
 * @file game.ts
 * @description Frontend TypeScript types for game run session state, stages, battle states, player acquired actions, enemy combatants, and turn results.
 */

import { CombatAction } from "./action.js";
import { Item, InventoryItem } from "./item.js";

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
