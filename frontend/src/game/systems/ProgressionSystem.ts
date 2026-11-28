/**
 * @file ProgressionSystem.ts
 * @description System managing XP rewards from defeated enemies (XP drop amount multiplied by level), XP threshold calculations for leveling up, and stat point allocations.
 */

import type { EnemyBattleState, PlayerBattleState } from "../../types/game.js";

export const XP_PER_LEVEL = 100;

export type AllocatableStat = "hp" | "attack" | "defense" | "crit_chance";

export interface LevelProgressInfo {
    level: number;
    currentLevelXp: number;
    xpForNextLevel: number;
    progressPercent: number;
}

/**
 * Derives the player's current XP level and progress toward the next level
 * from their total accumulated XP.
 */
export function calculateLevelProgress(totalXp: number): LevelProgressInfo {
    const safeXp = Math.max(0, Math.floor(totalXp));
    const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
    const currentLevelXp = safeXp % XP_PER_LEVEL;

    return {
        level,
        currentLevelXp,
        xpForNextLevel: XP_PER_LEVEL,
        progressPercent: (currentLevelXp / XP_PER_LEVEL) * 100,
    };
}

/**
 * Calculates the XP granted for defeating an enemy.
 * Scales enemy base XP drop by the current dungeon depth and run XP multiplier.
 */
export function calculateEnemyXpReward(
    enemy: Pick<EnemyBattleState, "xpDropAmount">,
    currentDepth: number,
    xpMultiplier: number = 1.0
): number {
    const effectiveDepth = Math.max(1, currentDepth);
    return Math.max(1, Math.round(enemy.xpDropAmount * effectiveDepth * xpMultiplier));
}

/**
 * Returns the number of stat points awarded upon reaching a new XP level.
 * Higher levels grant additional stat points.
 */
export function getStatPointsForLevelUp(newLevel: number): number {
    return 2 + Math.floor(Math.max(1, newLevel) / 3);
}

/**
 * Applies a stat point allocation to the player's battle state and returns a new state object.
 */
export function applyStatAllocation(
    player: PlayerBattleState,
    stat: AllocatableStat,
    points: number = 1
): PlayerBattleState {
    if (points <= 0) return player;

    switch (stat) {
        case "hp": {
            const hpGain = 10 * points;
            return {
                ...player,
                maxHp: player.maxHp + hpGain,
                currentHp: player.currentHp + hpGain,
            };
        }
        case "attack":
            return {
                ...player,
                attack: player.attack + 2 * points,
            };
        case "defense":
            return {
                ...player,
                defense: player.defense + 2 * points,
            };
        case "crit_chance":
            return {
                ...player,
                crit_chance: Math.min(100, player.crit_chance + 3 * points),
            };
    }
}
