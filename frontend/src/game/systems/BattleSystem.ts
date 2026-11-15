/**
 * @file BattleSystem.ts
 * @description Turn-based combat system managing turn order based on Speed priority, player action choices (offensive attack with targeting or defensive shield), enemy turns, accuracy checks, critical strike calculations, armor-piercing verification, and damage reduction [Defence / (Defence + 10)].
 */

import { CombatAction } from "../../types/action.js";
import {
    PlayerBattleState,
    EnemyBattleState,
    CombatTurnResult,
    BattleSessionState
} from "../../types/game.js";

/**
 * Calculates mitigated damage using the formula:
 * Damage Reduction = Defence / (Defence + 10)
 * Mitigated Damage = Raw Damage * (1 - Damage Reduction)
 */
export function calculateDamage(
    rawDamage: number,
    targetDefense: number,
    armorPiercing: boolean = false
): number {
    if (armorPiercing) {
        return Math.max(1, Math.round(rawDamage));
    }

    const effectiveDefense = Math.max(0, targetDefense);
    const damageReduction = effectiveDefense / (effectiveDefense + 10);
    const mitigated = rawDamage * (1 - damageReduction);

    return Math.max(1, Math.round(mitigated));
}

/**
 * Executes a chosen CombatAction performed by the player against an optional target enemy.
 */
export function executePlayerAction(
    action: CombatAction,
    player: PlayerBattleState,
    targetEnemy?: EnemyBattleState
): CombatTurnResult {
    // 1. Defensive action (e.g. Shield for next turn)
    if (action.category === "defensive") {
        const shieldGranted = action.shieldAmount ?? 10;
        player.activeShield += shieldGranted;

        return {
            actorName: player.title,
            actionName: action.name,
            category: "defensive",
            hit: true,
            crit: false,
            damageDealt: 0,
            shieldApplied: shieldGranted,
            targetDefeated: false,
            logMessage: `${player.title} used ${action.name}, raising a shield for ${shieldGranted} damage mitigation!`
        };
    }

    // 2. Offensive action (requires enemy target)
    if (!targetEnemy) {
        throw new Error("Target enemy is required for offensive actions.");
    }

    // Accuracy check
    const hitRoll = Math.random() * 100;
    if (hitRoll > action.accuracy) {
        return {
            actorName: player.title,
            actionName: action.name,
            category: "offensive",
            targetName: targetEnemy.name,
            hit: false,
            crit: false,
            damageDealt: 0,
            shieldApplied: 0,
            targetDefeated: false,
            logMessage: `${player.title}'s ${action.name} missed ${targetEnemy.name}!`
        };
    }

    // Critical hit check
    const totalCritChance = player.crit_chance + (action.critChanceBonus ?? 0);
    const isCrit = Math.random() * 100 <= totalCritChance;
    const baseDamage = player.attack * (action.basePower ?? 1.0);
    const rawDamage = isCrit ? baseDamage * 2 : baseDamage;

    // Armor piercing check
    const isArmorPiercing = action.armorPiercing || player.armor_piercing;
    const finalDamage = calculateDamage(rawDamage, targetEnemy.defense, isArmorPiercing);

    // Apply damage to target
    targetEnemy.currentHp = Math.max(0, targetEnemy.currentHp - finalDamage);
    const isDefeated = targetEnemy.currentHp === 0;

    const critText = isCrit ? " Critical hit!" : "";
    const pierceText = isArmorPiercing ? " (Pierced Armor!)" : "";

    return {
        actorName: player.title,
        actionName: action.name,
        category: "offensive",
        targetName: targetEnemy.name,
        hit: true,
        crit: isCrit,
        damageDealt: finalDamage,
        shieldApplied: 0,
        targetDefeated: isDefeated,
        logMessage: `${player.title} used ${action.name} on ${targetEnemy.name} dealing ${finalDamage} damage!${critText}${pierceText}`
    };
}
