/**
 * @file PlayGamePage.tsx
 * @description In-game 2D combat arena screen showing the player on the left, enemies in a zig-zag formation on the right,
 * top-left HUD (health, level/wave progress, XP bar & level), top-center boss health bar, turn-based combat,
 * floating combat text, battle log, and automatic progress saving on level completion.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { DevConsole } from "../components/game/DevConsole.js";
import { CombatActionMenu } from "../components/game/CombatActionMenu.js";
import {
    executePlayerAction,
    executeEnemyAction,
} from "../game/systems/BattleSystem.js";
import {
    WAVES_PER_LEVEL,
    spawnWaveEnemies,
    isBossEncounter,
    handleLevelCompletion,
} from "../game/systems/StageManager.js";
import {
    calculateLevelProgress,
    calculateEnemyXpReward,
    getStatPointsForLevelUp,
    applyStatAllocation,
    type AllocatableStat,
} from "../game/systems/ProgressionSystem.js";
import type { PlayerBattleState, EnemyBattleState } from "../types/game.js";
import { DEFAULT_COMBAT_ACTIONS, type CombatAction } from "../types/action.js";
import type { InventoryItem } from "../types/item.js";

interface FloatingText {
    id: string;
    targetId: "player" | string;
    text: string;
    tone: "damage" | "crit" | "miss" | "heal" | "shield";
}

interface BattleLogEntry {
    id: string;
    text: string;
    tone: "player" | "enemy" | "system" | "reward";
}

const MAX_ROWS_PER_COLUMN = 4;

export const PlayGamePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        activeRun,
        selectedCharacter,
        journeyConfig,
        updateProgress,
        completeActiveRun,
    } = useGame();

    const initialDepth = Math.max(1, activeRun?.level_reached || 1);
    const initialXp = activeRun?.score ?? 0;

    // Player battle state
    const [player, setPlayer] = useState<PlayerBattleState>(() => {
        const baseHp = selectedCharacter?.hp ?? 100;
        const bonusHp = journeyConfig.statBonuses?.hpBonus ?? 0;
        const totalHp = baseHp + bonusHp;

        const baseAtk = selectedCharacter?.attack ?? 16;
        const bonusAtk = journeyConfig.statBonuses?.attackBonus ?? 0;
        const totalAtk = Math.round(
            (baseAtk + bonusAtk) * (journeyConfig.multipliers?.damageMultiplier ?? 1.0)
        );

        const baseDef = selectedCharacter?.defense ?? 10;
        const bonusDef = journeyConfig.statBonuses?.defenseBonus ?? 0;
        const totalDef = baseDef + bonusDef;

        const baseCrit = selectedCharacter?.crit_chance ?? 10;
        const bonusCrit = journeyConfig.statBonuses?.critBonus ?? 0;
        const totalCrit = baseCrit + bonusCrit;

        return {
            characterId: selectedCharacter?.id ?? 1,
            title: selectedCharacter?.title ?? "Skreech",
            currentHp: totalHp,
            maxHp: totalHp,
            attack: totalAtk,
            defense: totalDef,
            crit_chance: totalCrit,
            armor_piercing: selectedCharacter?.armor_piercing ?? false,
            luck: 10,
            speed: true,
            acquiredActions: [...DEFAULT_COMBAT_ACTIONS],
            activeShield: 0,
        };
    });

    const [currentDepth, setCurrentDepth] = useState<number>(initialDepth);
    const [currentWave, setCurrentWave] = useState<number>(1);
    const [totalXp, setTotalXp] = useState<number>(initialXp);
    const [currentLevel, setCurrentLevel] = useState<number>(
        () => calculateLevelProgress(initialXp).level
    );
    const [pendingStatPoints, setPendingStatPoints] = useState<number>(0);

    // Enemies in arena
    const [enemies, setEnemies] = useState<EnemyBattleState[]>(() =>
        spawnWaveEnemies(initialDepth, 1, journeyConfig.enemySpawnRate)
    );

    // Player inventory
    const [inventory, setInventory] = useState<InventoryItem[]>([
        {
            item: {
                id: 101,
                name: "Bandages",
                description: "Restores 35 HP immediately.",
                effect_type: "heal",
                value: 35,
                rarity: "common",
            },
            quantity: 2,
        },
    ]);

    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
    const [isTransitioningWave, setIsTransitioningWave] = useState<boolean>(false);
    const [waveBanner, setWaveBanner] = useState<string | null>(null);
    const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([
        {
            id: "init-log",
            text: `Entered Depth ${initialDepth} — Wave 1/${WAVES_PER_LEVEL}.`,
            tone: "system",
        },
    ]);

    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll battle log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [battleLogs]);

    // Toggle dev console with backtick (`) only when cheats are enabled
    useEffect(() => {
        if (!journeyConfig.cheatsEnabled) {
            setIsConsoleOpen(false);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "`") {
                e.preventDefault();
                setIsConsoleOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [journeyConfig.cheatsEnabled]);

    const appendLog = useCallback((text: string, tone: BattleLogEntry["tone"]) => {
        setBattleLogs((prev) => [
            ...prev.slice(-40),
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                text,
                tone,
            },
        ]);
    }, []);

    const spawnFloatingText = useCallback(
        (targetId: string, text: string, tone: FloatingText["tone"]) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            setFloatingTexts((prev) => [...prev, { id, targetId, text, tone }]);
            setTimeout(() => {
                setFloatingTexts((prev) => prev.filter((ft) => ft.id !== id));
            }, 1450);
        },
        []
    );

    const showNotification = useCallback((msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 3500);
    }, []);

    // Award XP and check for level-up stat points
    const awardXp = useCallback(
        (xpGain: number): number => {
            const nextXp = totalXp + xpGain;
            setTotalXp(nextXp);

            const nextLevel = calculateLevelProgress(nextXp).level;
            if (nextLevel > currentLevel) {
                let gainedPoints = 0;
                for (let lvl = currentLevel + 1; lvl <= nextLevel; lvl++) {
                    gainedPoints += getStatPointsForLevelUp(lvl);
                }
                setCurrentLevel(nextLevel);
                setPendingStatPoints((prev) => prev + gainedPoints);
                appendLog(
                    `LEVEL UP! Reached Level ${nextLevel} (+${gainedPoints} stat point${gainedPoints > 1 ? "s" : ""})!`,
                    "reward"
                );
            }

            return nextXp;
        },
        [appendLog, currentLevel, totalXp]
    );

    const handleAllocateStat = (stat: AllocatableStat) => {
        if (pendingStatPoints <= 0) return;
        setPlayer((prev) => applyStatAllocation(prev, stat, 1));
        setPendingStatPoints((prev) => Math.max(0, prev - 1));
        const label =
            stat === "hp"
                ? "+10 Max HP"
                : stat === "attack"
                ? "+2 ATK"
                : stat === "defense"
                ? "+2 DEF"
                : "+3% CRIT";
        appendLog(`Allocated stat point: ${label}.`, "reward");
    };

    // Trigger enemy turn sequence after player acts
    const runEnemyTurn = useCallback(
        (currentEnemies: EnemyBattleState[], currentPlayer: PlayerBattleState) => {
            const living = currentEnemies.filter((e) => e.currentHp > 0);
            if (living.length === 0 || currentPlayer.currentHp <= 0) {
                setIsPlayerTurn(true);
                return;
            }

            setIsPlayerTurn(false);

            setTimeout(() => {
                const nextPlayer: PlayerBattleState = { ...currentPlayer };

                for (const enemy of living) {
                    if (nextPlayer.currentHp <= 0) break;
                    const result = executeEnemyAction(enemy, nextPlayer);
                    appendLog(result.logMessage, "enemy");

                    if (!result.hit) {
                        spawnFloatingText("player", "MISS!", "miss");
                    } else {
                        spawnFloatingText(
                            "player",
                            result.crit ? `CRIT! -${result.damageDealt}` : `-${result.damageDealt}`,
                            result.crit ? "crit" : "damage"
                        );
                    }
                }

                // Shield only lasts through the enemy turn
                nextPlayer.activeShield = 0;
                setPlayer(nextPlayer);

                if (nextPlayer.currentHp <= 0) {
                    appendLog(`${nextPlayer.title} was defeated in the sewer!`, "system");
                } else {
                    setIsPlayerTurn(true);
                }
            }, 850);
        },
        [appendLog, spawnFloatingText]
    );

    // Advance wave or complete level when all enemies are defeated
    const handleWaveCleared = useCallback(
        async (updatedXp: number, currentPlayerState: PlayerBattleState) => {
            setIsTransitioningWave(true);
            setIsPlayerTurn(false);

            if (currentWave < WAVES_PER_LEVEL) {
                const nextWave = currentWave + 1;
                const bossIncoming = isBossEncounter(currentDepth, nextWave);
                setWaveBanner(
                    bossIncoming ? `⚠ BOSS WAVE ${nextWave}/${WAVES_PER_LEVEL} INCOMING!` : `WAVE ${nextWave}/${WAVES_PER_LEVEL} INCOMING...`
                );
                appendLog(`Wave ${currentWave} cleared! Preparing Wave ${nextWave}...`, "system");

                setTimeout(() => {
                    const nextEnemies = spawnWaveEnemies(
                        currentDepth,
                        nextWave,
                        journeyConfig.enemySpawnRate
                    );
                    setCurrentWave(nextWave);
                    setEnemies(nextEnemies);
                    setWaveBanner(null);
                    setIsTransitioningWave(false);
                    setIsPlayerTurn(true);
                    appendLog(
                        `Depth ${currentDepth} — Wave ${nextWave}/${WAVES_PER_LEVEL} engaged!`,
                        "system"
                    );
                }, 1100);
                return;
            }

            // Final wave of the level cleared -> level completion & save progress
            const wasBoss = isBossEncounter(currentDepth, currentWave);
            const playerCopy: PlayerBattleState = {
                ...currentPlayerState,
                acquiredActions: [...currentPlayerState.acquiredActions],
            };
            const completion = handleLevelCompletion(currentDepth, playerCopy, wasBoss);
            setPlayer(playerCopy);

            if (completion.unlockedActions.length > 0) {
                const names = completion.unlockedActions.map((a) => a.name).join(", ");
                appendLog(`Unlocked new combat action(s): ${names}!`, "reward");
            }

            const nextDepth = currentDepth + 1;
            if (activeRun) {
                await updateProgress(updatedXp, nextDepth);
                showNotification(`✓ Progress Saved! Reached Depth ${nextDepth} (${updatedXp} XP)`);
                appendLog(`Progress saved! Advancing to Depth ${nextDepth}.`, "reward");
            } else {
                showNotification(`Depth ${currentDepth} Cleared! Advancing to Depth ${nextDepth}`);
                appendLog(`Depth ${currentDepth} cleared (offline mode — not saved).`, "system");
            }

            setWaveBanner(`DEPTH ${currentDepth} CLEARED! DESCENDING TO DEPTH ${nextDepth}...`);

            setTimeout(() => {
                const nextEnemies = spawnWaveEnemies(
                    nextDepth,
                    1,
                    journeyConfig.enemySpawnRate
                );
                setCurrentDepth(nextDepth);
                setCurrentWave(1);
                setEnemies(nextEnemies);
                setWaveBanner(null);
                setIsTransitioningWave(false);
                setIsPlayerTurn(true);
                appendLog(`Entered Depth ${nextDepth} — Wave 1/${WAVES_PER_LEVEL}.`, "system");
            }, 1400);
        },
        [
            activeRun,
            appendLog,
            currentDepth,
            currentWave,
            journeyConfig.enemySpawnRate,
            showNotification,
            updateProgress,
        ]
    );

    // Handle player combat action selection
    const handleSelectAction = (action: CombatAction, targetEnemyId?: string) => {
        if (!isPlayerTurn || isTransitioningWave || player.currentHp <= 0) return;

        const playerCopy: PlayerBattleState = { ...player };
        const enemiesCopy: EnemyBattleState[] = enemies.map((e) => ({ ...e }));

        if (action.category === "defensive" || action.targetType === "self") {
            const result = executePlayerAction(action, playerCopy);
            setPlayer(playerCopy);
            appendLog(result.logMessage, "player");
            spawnFloatingText("player", `+${result.shieldApplied} SHIELD`, "shield");
            runEnemyTurn(enemiesCopy, playerCopy);
            return;
        }

        const targetIdx = enemiesCopy.findIndex((e) => e.id === targetEnemyId && e.currentHp > 0);
        if (targetIdx === -1) return;

        const targetEnemy = enemiesCopy[targetIdx];
        const result = executePlayerAction(action, playerCopy, targetEnemy);
        appendLog(result.logMessage, "player");

        if (!result.hit) {
            spawnFloatingText(targetEnemy.id, "MISS!", "miss");
        } else {
            spawnFloatingText(
                targetEnemy.id,
                result.crit ? `CRIT! -${result.damageDealt}` : `-${result.damageDealt}`,
                result.crit ? "crit" : "damage"
            );
        }

        let updatedXp = totalXp;
        if (result.targetDefeated) {
            const xpGain = calculateEnemyXpReward(
                targetEnemy,
                currentDepth,
                journeyConfig.multipliers?.xpMultiplier ?? 1.0
            );
            updatedXp = awardXp(xpGain);
            appendLog(`${targetEnemy.name} defeated! +${xpGain} XP`, "reward");
        }

        const remainingEnemies = enemiesCopy.filter((e) => e.currentHp > 0);
        setEnemies(remainingEnemies);
        setPlayer(playerCopy);

        if (remainingEnemies.length === 0) {
            handleWaveCleared(updatedXp, playerCopy);
        } else {
            runEnemyTurn(remainingEnemies, playerCopy);
        }
    };

    // Use inventory item
    const handleUseItem = (itemEntry: InventoryItem) => {
        if (!isPlayerTurn || isTransitioningWave || player.currentHp <= 0) return;
        if (itemEntry.quantity <= 0) return;

        const playerCopy: PlayerBattleState = { ...player };
        let enemiesCopy: EnemyBattleState[] = enemies.map((e) => ({ ...e }));
        let updatedXp = totalXp;

        if (itemEntry.item.effect_type === "heal") {
            const healVal = itemEntry.item.value;
            playerCopy.currentHp = Math.min(playerCopy.maxHp, playerCopy.currentHp + healVal);
            spawnFloatingText("player", `+${healVal} HP`, "heal");
            appendLog(`Used ${itemEntry.item.name}, restoring ${healVal} HP.`, "player");
        } else if (itemEntry.item.effect_type === "shield") {
            playerCopy.activeShield += itemEntry.item.value;
            spawnFloatingText("player", `+${itemEntry.item.value} SHIELD`, "shield");
            appendLog(`Used ${itemEntry.item.name}, gaining +${itemEntry.item.value} shield.`, "player");
        } else if (itemEntry.item.effect_type === "damage") {
            if (enemiesCopy.length > 0) {
                const target = enemiesCopy[0];
                target.currentHp = Math.max(0, target.currentHp - itemEntry.item.value);
                spawnFloatingText(target.id, `-${itemEntry.item.value}`, "damage");
                appendLog(
                    `Threw ${itemEntry.item.name} dealing ${itemEntry.item.value} true damage to ${target.name}!`,
                    "player"
                );
                if (target.currentHp === 0) {
                    const xpGain = calculateEnemyXpReward(
                        target,
                        currentDepth,
                        journeyConfig.multipliers?.xpMultiplier ?? 1.0
                    );
                    updatedXp = awardXp(xpGain);
                    appendLog(`${target.name} defeated! +${xpGain} XP`, "reward");
                }
                enemiesCopy = enemiesCopy.filter((e) => e.currentHp > 0);
            }
        }

        setPlayer(playerCopy);
        setEnemies(enemiesCopy);
        setInventory((prev) =>
            prev
                .map((inv) =>
                    inv.item.id === itemEntry.item.id ? { ...inv, quantity: inv.quantity - 1 } : inv
                )
                .filter((inv) => inv.quantity > 0)
        );

        if (enemiesCopy.length === 0) {
            handleWaveCleared(updatedXp, playerCopy);
        } else {
            runEnemyTurn(enemiesCopy, playerCopy);
        }
    };

    // Manual Stage Clear utility button
    const handleSimulateStageClear = async () => {
        if (!activeRun || isTransitioningWave) return;
        const nextDepth = currentDepth + 1;
        const xpGain = Math.round(250 * (journeyConfig.multipliers?.xpMultiplier ?? 1.0));
        const nextXp = awardXp(xpGain);
        await updateProgress(nextXp, nextDepth);
        setCurrentDepth(nextDepth);
        setCurrentWave(1);
        setEnemies(spawnWaveEnemies(nextDepth, 1, journeyConfig.enemySpawnRate));
        showNotification(`✓ Progress Saved! Reached Depth ${nextDepth} (+${xpGain} XP)`);
        appendLog(`Manual stage clear saved! Advanced to Depth ${nextDepth}.`, "reward");
    };

    // Finish Run
    const handleFinishRun = async () => {
        if (activeRun) {
            await completeActiveRun(totalXp, currentDepth);
        }
        navigate("/continue-journey");
    };

    // Derived HUD values
    const levelInfo = calculateLevelProgress(totalXp);
    const activeBoss = enemies.find((e) => e.isBoss && e.currentHp > 0) || null;

    // Group enemies into columns of up to 4 rows for the zig-zag checkerboard layout
    const enemyColumns: EnemyBattleState[][] = [];
    for (let i = 0; i < enemies.length; i += MAX_ROWS_PER_COLUMN) {
        enemyColumns.push(enemies.slice(i, i + MAX_ROWS_PER_COLUMN));
    }

    const renderFloatingTexts = (targetId: string) => {
        const items = floatingTexts.filter((ft) => ft.targetId === targetId);
        if (items.length === 0) return null;

        return (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 space-y-0.5">
                {items.map((ft) => {
                    const color =
                        ft.tone === "crit"
                            ? "text-yellow-300 text-sm"
                            : ft.tone === "miss"
                            ? "text-gray-400 text-xs"
                            : ft.tone === "heal"
                            ? "text-[#b9f046] text-xs"
                            : ft.tone === "shield"
                            ? "text-blue-300 text-xs"
                            : "text-red-400 text-xs";

                    return (
                        <span
                            key={ft.id}
                            className={`font-black uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] animate-bounce ${color}`}
                        >
                            {ft.text}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="min-h-screen bg-[#070c0a] text-white p-3 md:p-5 font-mono flex flex-col justify-between select-none relative"
            style={{ fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'` }}
        >
            {/* Dev Console Component (only mounted/accessible when cheats are enabled) */}
            {journeyConfig.cheatsEnabled && (
                <DevConsole
                    isOpen={isConsoleOpen}
                    onClose={() => setIsConsoleOpen(false)}
                    player={player}
                    setPlayer={setPlayer}
                    enemies={enemies}
                    setEnemies={setEnemies}
                    inventory={inventory}
                    setInventory={setInventory}
                    onAddLog={(log) => appendLog(`[DEV] ${log}`, "system")}
                />
            )}

            {/* Top Utility Strip */}
            <header className="max-w-6xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 text-xs tracking-widest uppercase border-b border-[#1b2b23] pb-3 mb-3">
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        className="px-3 py-1.5 bg-black/60 border border-[#2b3a2a] text-[#789077] hover:text-[#b9f046] hover:border-[#b9f046] transition-colors"
                    >
                        ← MAIN MENU
                    </Link>
                    {journeyConfig.cheatsEnabled && (
                        <button
                            type="button"
                            onClick={() => setIsConsoleOpen((prev) => !prev)}
                            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase border transition-all ${
                                isConsoleOpen
                                    ? "bg-[#b9f046] text-black border-[#b9f046]"
                                    : "bg-black/60 text-[#b9f046] border-[#293d33] hover:border-[#b9f046]"
                            }`}
                        >
                            {isConsoleOpen ? "HIDE CONSOLE [`]" : "DEV CONSOLE [`]"}
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {journeyConfig.cheatsEnabled && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px]">
                            CHEATS ON
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleSimulateStageClear}
                        disabled={!activeRun || isTransitioningWave}
                        className="px-2.5 py-1 bg-[#14201c] border border-[#293d33] hover:border-[#b9f046] hover:text-[#b9f046] text-[10px] font-bold uppercase disabled:opacity-40"
                    >
                        ⚔ CLEAR STAGE
                    </button>
                    <button
                        type="button"
                        onClick={handleFinishRun}
                        disabled={!activeRun}
                        className="px-2.5 py-1 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-200 text-[10px] font-bold uppercase disabled:opacity-40"
                    >
                        🏆 COMPLETE RUN
                    </button>
                    <span className="text-[#8ca872] text-[10px] pl-1">
                        RUN #{activeRun ? activeRun.id : "OFFLINE"}
                    </span>
                </div>
            </header>

            {/* Main Combat Content */}
            <main className="flex-1 flex flex-col items-center max-w-6xl mx-auto w-full gap-3">
                {feedback && (
                    <div className="px-4 py-1.5 bg-green-950/90 border border-green-500 text-[#b9f046] text-xs font-bold tracking-wider">
                        {feedback}
                    </div>
                )}

                {/* 16:9 Combat Arena Viewport */}
                <section
                    className="relative w-full aspect-video min-h-[380px] max-h-[580px] bg-[#0a1310] border-2 border-[#22352d] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 50% 60%, rgba(28, 52, 42, 0.35), rgba(7, 12, 10, 0.95) 75%)",
                    }}
                >
                    {/* Arena Floor Horizon Line */}
                    <div className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-[#060a08] via-[#0c1713] to-transparent border-t border-[#182821] pointer-events-none" />

                    {/* TOP-LEFT HUD: Health Bar, Level/Wave Progress Bar, XP Bar & Level Indicator */}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 pointer-events-none">
                        <div className="w-56 md:w-64 bg-black/75 border border-[#24382f] p-2.5 space-y-1.5 backdrop-blur-sm">
                            {/* Name + Player XP Level Indicator */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs md:text-sm font-black uppercase text-white tracking-wider truncate">
                                    {player.title}
                                </span>
                                <span className="px-2 py-0.5 bg-[#b9f046] text-black font-black text-[10px] tracking-widest">
                                    LVL {levelInfo.level}
                                </span>
                            </div>

                            {/* Health Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-red-400 font-bold">HP</span>
                                    <span className="text-white font-bold">
                                        {player.currentHp} / {player.maxHp}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#14201c] border border-[#293d33] overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-300"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (player.currentHp / player.maxHp) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* XP Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                    <span className="text-[#b9f046] font-bold">XP</span>
                                    <span className="text-[#9cb19e]">
                                        {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-[#14201c] border border-[#293d33] overflow-hidden">
                                    <div
                                        className="h-full bg-[#b9f046] transition-all duration-300"
                                        style={{ width: `${levelInfo.progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Level / Wave Progress Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-cyan-300 font-bold">DEPTH {currentDepth}</span>
                                    <span className="text-[#9cb19e]">
                                        WAVE {currentWave} / {WAVES_PER_LEVEL}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    {Array.from({ length: WAVES_PER_LEVEL }, (_, idx) => {
                                        const waveNum = idx + 1;
                                        const isDone = waveNum < currentWave;
                                        const isCurrent = waveNum === currentWave;
                                        return (
                                            <div
                                                key={waveNum}
                                                className={`h-1.5 border ${
                                                    isDone
                                                        ? "bg-cyan-400 border-cyan-300"
                                                        : isCurrent
                                                        ? "bg-cyan-600/80 border-cyan-400 animate-pulse"
                                                        : "bg-[#14201c] border-[#293d33]"
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOP-CENTER BOSS HEALTH BAR */}
                    {activeBoss && (
                        <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 w-[48%] md:w-[44%] z-20 bg-black/85 border-2 border-red-600 px-3 py-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider mb-1">
                                <span className="text-red-400 flex items-center gap-1.5">
                                    <span>👑</span>
                                    <span>{activeBoss.name}</span>
                                </span>
                                <span className="text-white">
                                    {activeBoss.currentHp} / {activeBoss.maxHp} HP
                                </span>
                            </div>
                            <div className="w-full h-3 bg-[#1f1111] border border-red-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (activeBoss.currentHp / activeBoss.maxHp) * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* COMBAT STAGE: Left Player / Right Enemies */}
                    <div className="relative z-10 flex-1 flex items-center justify-between pt-20 pb-4 px-8 md:px-14 pr-12 md:pr-20">
                        {/* LEFT SIDE: Player Placeholder Sprite Facing Right */}
                        <div className="relative flex flex-col items-center self-end mb-6">
                            {renderFloatingTexts("player")}

                            {player.activeShield > 0 && (
                                <div className="mb-1.5 px-2 py-0.5 bg-blue-950/90 border border-blue-400 text-blue-200 text-[10px] font-bold">
                                    🛡 +{player.activeShield}
                                </div>
                            )}

                            {/* Colored Rectangle Placeholder Sprite Facing Right */}
                            <div
                                className={`w-24 h-28 md:w-28 md:h-32 bg-[#172d24] border-2 border-[#b9f046] shadow-[0_0_18px_rgba(185,240,70,0.25)] flex flex-col items-center justify-center relative transition-transform duration-200 ${
                                    !isPlayerTurn ? "opacity-90" : "scale-105"
                                }`}
                            >
                                <span className="text-4xl md:text-5xl inline-block scale-x-100 select-none">
                                    🐀
                                </span>
                                <span className="text-[9px] text-[#b9f046] font-bold uppercase tracking-widest mt-1">
                                    {player.title}
                                </span>
                            </div>

                            {/* Shadow Base */}
                            <div className="w-24 h-2.5 bg-black/60 rounded-full mt-1.5 blur-[1px]" />
                        </div>

                        {/* RIGHT SIDE: Enemies in Zig-Zag Checkerboard Pattern (max 4 rows per column) */}
                        <div className="flex items-center justify-end gap-6 md:gap-8">
                            {enemies.length === 0 ? (
                                <div className="text-xs text-[#789077] uppercase tracking-widest italic pr-8">
                                    {waveBanner ? "" : "No enemies in sight..."}
                                </div>
                            ) : (
                                enemyColumns.map((colEnemies, colIdx) => (
                                    <div key={`col-${colIdx}`} className="flex flex-col gap-2 md:gap-2.5">
                                        {colEnemies.map((enemy, rowIdx) => {
                                            // Checkerboard zig-zag offset on odd rows
                                            const zigzagOffset =
                                                rowIdx % 2 === 1 ? "translate-x-4 md:translate-x-5" : "";

                                            return (
                                                <div
                                                    key={enemy.id}
                                                    className={`relative flex flex-col items-center transition-transform ${zigzagOffset}`}
                                                >
                                                    {renderFloatingTexts(enemy.id)}

                                                    {/* Small Health Bar above non-boss enemy heads */}
                                                    {!enemy.isBoss && (
                                                        <div className="w-20 mb-0.5 bg-black/85 border border-[#2a3f35] px-1 py-0.5">
                                                            <div className="flex justify-between text-[8px] leading-none mb-0.5">
                                                                <span className="text-white font-bold truncate max-w-[50px]">
                                                                    {enemy.name}
                                                                </span>
                                                                <span className="text-red-300">
                                                                    {enemy.currentHp}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1 bg-[#1b2621] overflow-hidden">
                                                                <div
                                                                    className="h-full bg-red-500 transition-all duration-300"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            100,
                                                                            Math.max(
                                                                                0,
                                                                                (enemy.currentHp / enemy.maxHp) *
                                                                                    100
                                                                            )
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Colored Rectangle Placeholder Sprite Facing Left */}
                                                    <div
                                                        className={`flex flex-col items-center justify-center border-2 transition-all ${
                                                            enemy.isBoss
                                                                ? "w-20 h-24 md:w-24 md:h-28 bg-[#2b1212] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                                                                : "w-14 h-14 md:w-16 md:h-16 bg-[#1d171c] border-red-800/80 shadow-[0_0_10px_rgba(0,0,0,0.6)]"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`${
                                                                enemy.isBoss ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                                                            } inline-block -scale-x-100 select-none`}
                                                        >
                                                            {enemy.isBoss ? "👑" : "💀"}
                                                        </span>
                                                        {enemy.isBoss && (
                                                            <span className="text-[8px] text-red-300 font-bold uppercase tracking-wider mt-0.5">
                                                                BOSS
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Shadow Base */}
                                                    <div
                                                        className={`${
                                                            enemy.isBoss ? "w-20" : "w-12"
                                                        } h-1.5 bg-black/60 rounded-full mt-1 blur-[1px]`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Wave Transition Overlay */}
                    {waveBanner && (
                        <div className="absolute inset-0 z-30 bg-black/55 flex items-center justify-center pointer-events-none">
                            <div className="px-6 py-3 bg-[#0c1613] border-2 border-[#b9f046] text-[#b9f046] font-black text-sm md:text-lg tracking-widest uppercase shadow-[0_0_25px_rgba(185,240,70,0.35)]">
                                {waveBanner}
                            </div>
                        </div>
                    )}

                    {/* Level-Up Stat Allocation Pop-up */}
                    {pendingStatPoints > 0 && player.currentHp > 0 && (
                        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
                            <div className="w-full max-w-md bg-[#0c1613] border-2 border-[#b9f046] p-5 shadow-[0_0_30px_rgba(185,240,70,0.35)] text-center">
                                <div className="text-[10px] text-[#b9f046] font-bold tracking-widest uppercase mb-1">
                                    ★ LEVEL UP ★
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                                    XP Level {currentLevel} Reached!
                                </h2>
                                <p className="text-xs text-[#9cb19e] mb-4">
                                    Allocate your stat point{pendingStatPoints > 1 ? "s" : ""}{" "}
                                    (<span className="text-[#b9f046] font-bold">{pendingStatPoints} remaining</span>):
                                </p>

                                <div className="grid grid-cols-2 gap-2.5 text-left">
                                    <button
                                        type="button"
                                        onClick={() => handleAllocateStat("hp")}
                                        className="p-3 bg-[#111917] hover:bg-[#16241f] border border-[#293d33] hover:border-[#b9f046] transition"
                                    >
                                        <div className="text-xs font-bold text-red-400 uppercase">HP (+10)</div>
                                        <div className="text-[11px] text-white mt-0.5">
                                            Current: {player.maxHp}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAllocateStat("attack")}
                                        className="p-3 bg-[#111917] hover:bg-[#16241f] border border-[#293d33] hover:border-[#b9f046] transition"
                                    >
                                        <div className="text-xs font-bold text-[#b9f046] uppercase">Attack (+2)</div>
                                        <div className="text-[11px] text-white mt-0.5">
                                            Current: {player.attack}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAllocateStat("defense")}
                                        className="p-3 bg-[#111917] hover:bg-[#16241f] border border-[#293d33] hover:border-[#b9f046] transition"
                                    >
                                        <div className="text-xs font-bold text-blue-400 uppercase">Defense (+2)</div>
                                        <div className="text-[11px] text-white mt-0.5">
                                            Current: {player.defense}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAllocateStat("crit_chance")}
                                        className="p-3 bg-[#111917] hover:bg-[#16241f] border border-[#293d33] hover:border-[#b9f046] transition"
                                    >
                                        <div className="text-xs font-bold text-yellow-300 uppercase">Crit (+3%)</div>
                                        <div className="text-[11px] text-white mt-0.5">
                                            Current: {player.crit_chance}%
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Player Defeat Overlay */}
                    {player.currentHp <= 0 && (
                        <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
                            <div className="text-4xl mb-2">💀</div>
                            <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2">
                                FALLEN IN THE SEWERS
                            </h2>
                            <p className="text-xs text-[#9cb19e] mb-5">
                                {player.title} fell at Depth {currentDepth} (Wave {currentWave}) with{" "}
                                {totalXp} XP.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleFinishRun}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider"
                                >
                                    END & RECORD RUN
                                </button>
                                <Link
                                    to="/"
                                    className="px-5 py-2.5 bg-[#14201c] border border-[#293d33] hover:border-[#b9f046] text-xs font-bold uppercase tracking-wider"
                                >
                                    MAIN MENU
                                </Link>
                            </div>
                        </div>
                    )}
                </section>

                {/* Bottom Dock: Combat Action Menu + Scrollable Battle Log */}
                <section className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                    <div className="md:col-span-7">
                        <CombatActionMenu
                            isPlayerTurn={
                                isPlayerTurn &&
                                !isTransitioningWave &&
                                pendingStatPoints === 0 &&
                                player.currentHp > 0
                            }
                            actions={player.acquiredActions}
                            inventory={inventory}
                            enemies={enemies}
                            onSelectAction={handleSelectAction}
                            onUseItem={handleUseItem}
                        />
                    </div>

                    {/* Battle Log Panel */}
                    <div className="md:col-span-5 border-2 border-[#22352d] bg-[#0c1613] p-3 flex flex-col justify-between">
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#182620] text-[11px] uppercase tracking-wider">
                            <span className="font-bold text-[#8ca872]">Battle Log</span>
                            <span className="text-[10px] text-[#556954]">
                                ATK {player.attack} · DEF {player.defense} · CRIT {player.crit_chance}%
                            </span>
                        </div>
                        <div className="flex-1 max-h-44 overflow-y-auto space-y-1 pr-1 text-[11px]">
                            {battleLogs.map((entry) => {
                                const toneClass =
                                    entry.tone === "player"
                                        ? "text-[#b9f046]"
                                        : entry.tone === "enemy"
                                        ? "text-red-400"
                                        : entry.tone === "reward"
                                        ? "text-yellow-300 font-bold"
                                        : "text-[#8ca872]";

                                return (
                                    <div key={entry.id} className={`${toneClass} leading-snug`}>
                                        &gt; {entry.text}
                                    </div>
                                );
                            })}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="max-w-6xl w-full mx-auto text-[10px] text-[#556954] tracking-widest uppercase border-t border-[#1b2b23] pt-3 mt-3 flex justify-between items-center">
                <div>{journeyConfig.cheatsEnabled ? "PRESS ` TO TOGGLE DEV CONSOLE" : "COMBAT ARENA"}</div>
                <div>THE SEWER. THE CROWN.</div>
            </footer>
        </div>
    );
};

export default PlayGamePage;
