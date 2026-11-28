/**
 * @file StageManager.ts
 * @description System controlling stage progression, enemy wave spawning, difficulty scaling per level, awarding level-completion combat actions, and triggering card drafts upon level clear.
 */

import { CombatAction, getActionsUnlockedAtLevel } from "../../types/action.js";
import type { EnemyBattleState, EnemySpawnRate, PlayerBattleState } from "../../types/game.js";

export const WAVES_PER_LEVEL = 3;

export const BOSS_ENTRANCE_SFX = "/assets/audio/sfx/boss_entrance.wav";
export const MONSTER_ENTRANCE_SFX = "/assets/audio/sfx/monster_entrance.wav";

export type BossKey =
    | "ractopus"
    | "mold_lord"
    | "blight_tank"
    | "grand_mutator"
    | "verminking";

export interface LevelDefinition {
    level: number;
    location: string;
    musicPath: string;
    bossKey: BossKey | null;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
    {
        level: 1,
        location: "Sewer Entrance",
        musicPath: "/assets/audio/music/levels/level_1_sewer_entrance.wav",
        bossKey: null,
    },
    {
        level: 2,
        location: "Toxic Lake",
        musicPath: "/assets/audio/music/levels/level_2_toxic_lake.wav",
        bossKey: "ractopus",
    },
    {
        level: 3,
        location: "Spawning Grounds",
        musicPath: "/assets/audio/music/levels/level_3_spawning_grounds.wav",
        bossKey: "mold_lord",
    },
    {
        level: 4,
        location: "Rattown",
        musicPath: "/assets/audio/music/levels/level_4_rattown.wav",
        bossKey: null,
    },
    {
        level: 5,
        location: "Castle Entrance",
        musicPath: "/assets/audio/music/levels/level_5_castle_entrance.wav",
        bossKey: "blight_tank",
    },
    {
        level: 6,
        location: "Grand Laboratory",
        musicPath: "/assets/audio/music/levels/level_6_grand_laboratory.wav",
        bossKey: "grand_mutator",
    },
    {
        level: 7,
        location: "Castle Halls",
        musicPath: "/assets/audio/music/levels/level_7_castle_halls.wav",
        bossKey: null,
    },
    {
        level: 8,
        location: "Throne Room",
        musicPath: "/assets/audio/music/levels/level_8_throne_room.wav",
        bossKey: "verminking",
    },
];

export interface LevelCompletionResult {
    completedLevel: number;
    unlockedActions: CombatAction[];
    triggerCardDraft: boolean;
    isBossLevel: boolean;
    draftOptionCount: number; // 3 standard, +3 bonus if boss defeated per context.txt
}

interface EnemyPoolEntry {
    key: string;
    category: "conventional" | "monster";
    weight: number;
    minLevel: number;
    template: Omit<EnemyBattleState, "id">;
}

const ENEMY_POOL: EnemyPoolEntry[] = [
    {
        key: "sewer_rat",
        category: "conventional",
        weight: 45,
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
        key: "gutter_runner",
        category: "conventional",
        weight: 35,
        minLevel: 1,
        template: {
            name: "Gutter Runner",
            currentHp: 35,
            maxHp: 35,
            attack: 13,
            defense: 2,
            crit_chance: 20,
            armor_piercing: false,
            accuracy: 95,
            itemDropChance: 25,
            xpDropAmount: 35,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/gutter_runner.png",
        },
    },
    {
        key: "skitterers",
        category: "conventional",
        weight: 30,
        minLevel: 1,
        template: {
            name: "Skitterers",
            currentHp: 30,
            maxHp: 30,
            attack: 11,
            defense: 2,
            crit_chance: 15,
            armor_piercing: false,
            accuracy: 92,
            itemDropChance: 20,
            xpDropAmount: 30,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/skitterers.png",
        },
    },
    {
        key: "ironside",
        category: "conventional",
        weight: 22,
        minLevel: 3,
        template: {
            name: "Ironside",
            currentHp: 75,
            maxHp: 75,
            attack: 14,
            defense: 14,
            crit_chance: 5,
            armor_piercing: false,
            accuracy: 85,
            itemDropChance: 35,
            xpDropAmount: 55,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/ironside.png",
        },
    },
    {
        key: "apothecary",
        category: "conventional",
        weight: 20,
        minLevel: 4,
        template: {
            name: "Apothecary",
            currentHp: 55,
            maxHp: 55,
            attack: 16,
            defense: 6,
            crit_chance: 10,
            armor_piercing: true,
            accuracy: 90,
            itemDropChance: 45,
            xpDropAmount: 60,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/apothecary.png",
        },
    },
    {
        key: "monstrosity",
        category: "monster",
        weight: 18,
        minLevel: 2,
        template: {
            name: "Monstrosity",
            currentHp: 95,
            maxHp: 95,
            attack: 18,
            defense: 10,
            crit_chance: 10,
            armor_piercing: false,
            accuracy: 82,
            itemDropChance: 40,
            xpDropAmount: 80,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/monstrosity.png",
        },
    },
    {
        key: "vermin_gator",
        category: "monster",
        weight: 16,
        minLevel: 4,
        template: {
            name: "Vermin Gator",
            currentHp: 110,
            maxHp: 110,
            attack: 20,
            defense: 12,
            crit_chance: 12,
            armor_piercing: true,
            accuracy: 85,
            itemDropChance: 45,
            xpDropAmount: 95,
            isBoss: false,
            spriteUrl: "/assets/enemies/idle/vermin_gator.png",
        },
    },
];

const BOSS_TEMPLATES: Record<BossKey, { template: Omit<EnemyBattleState, "id">; musicPath: string }> = {
    ractopus: {
        musicPath: "/assets/audio/music/bosses/ractopus_theme.wav",
        template: {
            name: "Ractopus",
            currentHp: 160,
            maxHp: 160,
            attack: 18,
            defense: 10,
            crit_chance: 10,
            armor_piercing: false,
            accuracy: 85,
            itemDropChance: 60,
            xpDropAmount: 180,
            isBoss: true,
            spriteUrl: "/assets/enemies/idle/ractopus.png",
        },
    },
    mold_lord: {
        musicPath: "/assets/audio/music/bosses/mold_lord_theme.wav",
        template: {
            name: "Mold Lord",
            currentHp: 200,
            maxHp: 200,
            attack: 20,
            defense: 12,
            crit_chance: 10,
            armor_piercing: true,
            accuracy: 85,
            itemDropChance: 65,
            xpDropAmount: 240,
            isBoss: true,
            spriteUrl: "/assets/enemies/idle/mold_lord.png",
        },
    },
    blight_tank: {
        musicPath: "/assets/audio/music/bosses/blight_tank_theme.wav",
        template: {
            name: "Blight Tank",
            currentHp: 260,
            maxHp: 260,
            attack: 24,
            defense: 18,
            crit_chance: 10,
            armor_piercing: false,
            accuracy: 85,
            itemDropChance: 75,
            xpDropAmount: 320,
            isBoss: true,
            spriteUrl: "/assets/enemies/idle/blight_tank.png",
        },
    },
    grand_mutator: {
        musicPath: "/assets/audio/music/bosses/grand_mutator_theme.wav",
        template: {
            name: "Grand Mutator",
            currentHp: 280,
            maxHp: 280,
            attack: 26,
            defense: 14,
            crit_chance: 15,
            armor_piercing: true,
            accuracy: 90,
            itemDropChance: 85,
            xpDropAmount: 400,
            isBoss: true,
            spriteUrl: "/assets/enemies/idle/grand_mutator.png",
        },
    },
    verminking: {
        musicPath: "/assets/audio/music/bosses/verminking_theme.wav",
        template: {
            name: "Verminking",
            currentHp: 360,
            maxHp: 360,
            attack: 30,
            defense: 20,
            crit_chance: 20,
            armor_piercing: true,
            accuracy: 92,
            itemDropChance: 100,
            xpDropAmount: 600,
            isBoss: true,
            spriteUrl: "/assets/enemies/idle/verminking.png",
        },
    },
};

export function getLevelDefinition(level: number): LevelDefinition {
    const safeIndex = Math.max(0, Math.min(LEVEL_DEFINITIONS.length - 1, level - 1));
    return LEVEL_DEFINITIONS[safeIndex];
}

export function getLocationName(level: number): string {
    if (level <= 0) return LEVEL_DEFINITIONS[0].location;
    return getLevelDefinition(level).location;
}

export function getLevelMusicPath(level: number): string {
    return getLevelDefinition(level).musicPath;
}

export function getBossMusicPath(level: number): string | null {
    const bossKey = getLevelDefinition(level).bossKey;
    return bossKey ? BOSS_TEMPLATES[bossKey].musicPath : null;
}

export function getEnemyKeyFromName(name: string): string {
    return name.replace(/\s+#\d+$/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function getEnemyAttackSfx(enemy: Pick<EnemyBattleState, "name">): string {
    return `/assets/audio/sfx/enemies/${getEnemyKeyFromName(enemy.name)}_attack.wav`;
}

export function getEnemyHurtSfx(enemy: Pick<EnemyBattleState, "name">): string {
    return `/assets/audio/sfx/enemies/${getEnemyKeyFromName(enemy.name)}_hurt.wav`;
}

export function isMonsterEnemy(enemy: Pick<EnemyBattleState, "name" | "isBoss">): boolean {
    if (enemy.isBoss) return false;
    const key = getEnemyKeyFromName(enemy.name);
    const entry = ENEMY_POOL.find((e) => e.key === key);
    return entry?.category === "monster";
}

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
    const depthScale = 1 + Math.max(0, level - 1) * 0.12;
    const scaledHp = Math.round(template.maxHp * depthScale);

    return {
        ...template,
        id,
        name: nameOverride ?? template.name,
        maxHp: scaledHp,
        currentHp: scaledHp,
        attack: Math.round(template.attack * depthScale),
        defense: Math.round(template.defense * (1 + Math.max(0, level - 1) * 0.08)),
    };
}

/**
 * Returns true if the given dungeon depth has a boss encounter.
 */
export function isLevelBossDepth(level: number): boolean {
    return getLevelDefinition(level).bossKey !== null;
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
    const def = getLevelDefinition(safeLevel);

    if (def.bossKey && safeWave >= WAVES_PER_LEVEL) {
        const boss = scaleEnemyTemplate(
            BOSS_TEMPLATES[def.bossKey].template,
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
    const unlockedActions = getActionsUnlockedAtLevel(completedLevel);

    for (const action of unlockedActions) {
        const alreadyAcquired = player.acquiredActions.some((act) => act.id === action.id);
        if (!alreadyAcquired) {
            player.acquiredActions.push(action);
        }
    }

    const draftOptionCount = isBoss ? 6 : 3;

    return {
        completedLevel,
        unlockedActions,
        triggerCardDraft: true,
        isBossLevel: isBoss,
        draftOptionCount
    };
}
