/**
 * @file StageManager.ts
 * @description System controlling stage progression, enemy wave spawning, difficulty scaling per level, awarding level-completion combat actions, and triggering card drafts upon level clear.
 */

import { CombatAction, getActionsUnlockedAtLevel } from "../../types/action.js";
import type { EnemyBattleState, EnemySpawnRate, PlayerBattleState } from "../../types/game.js";

export const WAVES_PER_LEVEL = 3;

export interface LevelCompletionResult {
    completedLevel: number;
    unlockedActions: CombatAction[];
    triggerCardDraft: boolean;
    isBossLevel: boolean;
    draftOptionCount: number; // 3 standard, +3 bonus if boss defeated per context.txt
}

interface EnemyPoolEntry {
    key: string;
    weight: number;
    minLevel: number;
    template: Omit<EnemyBattleState, "id">;
}

const ENEMY_POOL: EnemyPoolEntry[] = [
    {
        key: "sewer_rat",
        weight: 50,
        minLevel: 1,
        template: {
            name: "Sewer Rat",
            currentHp: 40,
            maxHp: 40,
            attack: 10,
            defense: 4,
            crit_chance: 5,
            armor_piercing: false,
            accuracy: 90,
            itemDropChance: 25,
            xpDropAmount: 30,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/sewer_rat.png",
        },
    },
    {
        key: "plague_bat",
        weight: 30,
        minLevel: 1,
        template: {
            name: "Plague Bat",
            currentHp: 35,
            maxHp: 35,
            attack: 12,
            defense: 2,
            crit_chance: 20,
            armor_piercing: false,
            accuracy: 95,
            itemDropChance: 20,
            xpDropAmount: 35,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/bat.png",
        },
    },
    {
        key: "toxic_slime",
        weight: 25,
        minLevel: 2,
        template: {
            name: "Toxic Slime",
            currentHp: 65,
            maxHp: 65,
            attack: 14,
            defense: 8,
            crit_chance: 5,
            armor_piercing: true,
            accuracy: 85,
            itemDropChance: 35,
            xpDropAmount: 50,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/slime.png",
        },
    },
];

const BOSS_TEMPLATES: Record<"rat_ogre" | "rat_king", Omit<EnemyBattleState, "id">> = {
    rat_ogre: {
        name: "Rat Ogre",
        currentHp: 180,
        maxHp: 180,
        attack: 22,
        defense: 12,
        crit_chance: 10,
        armor_piercing: false,
        accuracy: 85,
        itemDropChance: 40,
        xpDropAmount: 150,
        isBoss: true,
        spriteUrl: "/assets/enemies/idle/rat_ogre.png",
    },
    rat_king: {
        name: "Rat King",
        currentHp: 300,
        maxHp: 300,
        attack: 28,
        defense: 18,
        crit_chance: 20,
        armor_piercing: true,
        accuracy: 90,
        itemDropChance: 100,
        xpDropAmount: 500,
        isBoss: true,
        spriteUrl: "/assets/enemies/idle/rat_king.png",
    },
};

function getBaseSpawnCount(spawnRate: EnemySpawnRate): number {
    switch (spawnRate) {
        case "low":
            return 1;
        case "swarm":
            return 3;
        case "horde":
            return 4;
        case "normal":
        default:
            return 2;
    }
}

function pickWeightedEnemy(level: number): EnemyPoolEntry {
    const eligible = ENEMY_POOL.filter((entry) => level >= entry.minLevel);
    const pool = eligible.length > 0 ? eligible : [ENEMY_POOL[0]];
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);

    let roll = Math.random() * totalWeight;
    for (const entry of pool) {
        roll -= entry.weight;
        if (roll <= 0) return entry;
    }
    return pool[0];
}

function scaleEnemyTemplate(
    template: Omit<EnemyBattleState, "id">,
    level: number,
    id: string,
    nameOverride?: string
): EnemyBattleState {
    const depthScale = 1 + Math.max(0, level - 1) * 0.15;
    const scaledHp = Math.round(template.maxHp * depthScale);

    return {
        ...template,
        id,
        name: nameOverride ?? template.name,
        maxHp: scaledHp,
        currentHp: scaledHp,
        attack: Math.round(template.attack * depthScale),
        defense: Math.round(template.defense * (1 + Math.max(0, level - 1) * 0.1)),
    };
}

/**
 * Returns true if the given dungeon depth is a boss level (every 3rd level).
 */
export function isLevelBossDepth(level: number): boolean {
    return level > 0 && level % 3 === 0;
}

/**
 * Returns true if the specific level + wave is a boss encounter.
 */
export function isBossEncounter(level: number, wave: number): boolean {
    return isLevelBossDepth(level) && wave >= WAVES_PER_LEVEL;
}

/**
 * Spawns a wave of enemies scaled to the current dungeon level, wave number, and spawn density.
 */
export function spawnWaveEnemies(
    level: number,
    wave: number,
    spawnRate: EnemySpawnRate = "normal"
): EnemyBattleState[] {
    const safeLevel = Math.max(1, level);
    const safeWave = Math.max(1, wave);
    const timestamp = Date.now();

    if (isBossEncounter(safeLevel, safeWave)) {
        const bossKey = safeLevel >= 6 ? "rat_king" : "rat_ogre";
        const boss = scaleEnemyTemplate(
            BOSS_TEMPLATES[bossKey],
            safeLevel,
            `boss-${safeLevel}-${safeWave}-${timestamp}`
        );
        const minionsCount = spawnRate === "horde" ? 2 : spawnRate === "swarm" ? 1 : 0;
        const enemies: EnemyBattleState[] = [boss];

        for (let i = 0; i < minionsCount; i++) {
            const picked = pickWeightedEnemy(safeLevel);
            enemies.push(
                scaleEnemyTemplate(
                    picked.template,
                    safeLevel,
                    `wave-${safeLevel}-${safeWave}-minion-${i}-${timestamp}`,
                    `${picked.template.name} #${i + 1}`
                )
            );
        }
        return enemies;
    }

    const baseCount = getBaseSpawnCount(spawnRate);
    // Slightly ramp count on later waves while capping at 6 so the 4-row zigzag stays clean
    const waveBonus = safeWave >= WAVES_PER_LEVEL && baseCount < 4 ? 1 : 0;
    const count = Math.min(6, baseCount + waveBonus);

    const enemies: EnemyBattleState[] = [];
    for (let i = 0; i < count; i++) {
        const picked = pickWeightedEnemy(safeLevel);
        enemies.push(
            scaleEnemyTemplate(
                picked.template,
                safeLevel,
                `wave-${safeLevel}-${safeWave}-${i}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
                count > 1 ? `${picked.template.name} #${i + 1}` : picked.template.name
            )
        );
    }

    return enemies;
}

/**
 * Evaluates completion of a level, unlocking any level-specific attacks
 * configured for that level, and preparing the card draft presentation.
 *
 * @param completedLevel - The level number just beaten
 * @param player - Active player state to receive newly unlocked actions
 * @param isBoss - Whether the level completed was a boss encounter
 */
export function handleLevelCompletion(
    completedLevel: number,
    player: PlayerBattleState,
    isBoss: boolean = false
): LevelCompletionResult {
    // 1. Check for any attacks/actions configured to unlock at this level completion
    const unlockedActions = getActionsUnlockedAtLevel(completedLevel);

    for (const action of unlockedActions) {
        const alreadyAcquired = player.acquiredActions.some((act) => act.id === action.id);
        if (!alreadyAcquired) {
            player.acquiredActions.push(action);
        }
    }

    // 2. Determine card drafting options (context.txt: 3 cards standard, +3 bonus when boss defeated)
    const draftOptionCount = isBoss ? 6 : 3;

    return {
        completedLevel,
        unlockedActions,
        triggerCardDraft: true,
        isBossLevel: isBoss,
        draftOptionCount
    };
}
