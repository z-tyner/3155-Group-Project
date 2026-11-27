/**
 * @file PlayGamePage.tsx
 * @description In-game gameplay arena and battle runner showing active journey session from GameContext.
 * Features in-game dev & cheat console toggled by backtick (`), enemy spawn tracking, and item usage.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { DevConsole } from "../components/game/DevConsole.js";
import type { PlayerBattleState, EnemyBattleState } from "../types/game.js";
import { DEFAULT_COMBAT_ACTIONS } from "../types/action.js";
import type { InventoryItem } from "../types/item.js";

export const PlayGamePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        activeRun,
        selectedCharacter,
        journeyConfig,
        updateProgress,
        completeActiveRun,
    } = useGame();

    // Player battle state
    const [player, setPlayer] = useState<PlayerBattleState>(() => {
        const baseHp = selectedCharacter?.hp ?? 100;
        const bonusHp = journeyConfig.statBonuses?.hpBonus ?? 0;
        const totalHp = baseHp + bonusHp;

        const baseAtk = selectedCharacter?.attack ?? 16;
        const bonusAtk = journeyConfig.statBonuses?.attackBonus ?? 0;
        const totalAtk = Math.round((baseAtk + bonusAtk) * (journeyConfig.multipliers?.damageMultiplier ?? 1.0));

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
            acquiredActions: DEFAULT_COMBAT_ACTIONS,
            activeShield: 0,
        };
    });

    // Enemies in arena
    const [enemies, setEnemies] = useState<EnemyBattleState[]>(() => {
        // Initial spawn based on spawn density
        const initialCount =
            journeyConfig.enemySpawnRate === "low"
                ? 1
                : journeyConfig.enemySpawnRate === "swarm"
                ? 3
                : journeyConfig.enemySpawnRate === "horde"
                ? 4
                : 2;

        const initialList: EnemyBattleState[] = [];
        for (let i = 0; i < initialCount; i++) {
            initialList.push({
                id: `init-rat-${i + 1}`,
                name: initialCount > 1 ? `Sewer Rat #${i + 1}` : "Sewer Rat",
                currentHp: 40,
                maxHp: 40,
                attack: 10,
                defense: 4,
                crit_chance: 5,
                armor_piercing: false,
                accuracy: 90,
                itemDropChance: 30,
                xpDropAmount: 30,
                isBoss: false,
                spriteUrl: "/assets/enemies/idle/sewer_rat.png",
            });
        }
        return initialList;
    });

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

    const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Toggle dev console with backtick (`)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "`") {
                e.preventDefault();
                setIsConsoleOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const showNotification = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 3500);
    };

    // Use inventory item
    const handleUseItem = (itemEntry: InventoryItem) => {
        if (itemEntry.quantity <= 0) return;

        if (itemEntry.item.effect_type === "heal") {
            const healVal = itemEntry.item.value;
            setPlayer((prev) => ({
                ...prev,
                currentHp: Math.min(prev.maxHp, prev.currentHp + healVal),
            }));
            showNotification(`Used ${itemEntry.item.name} and healed +${healVal} HP!`);
        } else if (itemEntry.item.effect_type === "shield") {
            setPlayer((prev) => ({
                ...prev,
                activeShield: prev.activeShield + itemEntry.item.value,
            }));
            showNotification(`Raised active shield mitigation by +${itemEntry.item.value}!`);
        } else if (itemEntry.item.effect_type === "damage") {
            if (enemies.length > 0) {
                const target = enemies[0];
                setEnemies((prev) =>
                    prev.map((e, idx) =>
                        idx === 0
                            ? { ...e, currentHp: Math.max(0, e.currentHp - itemEntry.item.value) }
                            : e
                    ).filter((e) => e.currentHp > 0)
                );
                showNotification(`Threw ${itemEntry.item.name} dealing ${itemEntry.item.value} true damage to ${target.name}!`);
            }
        }

        // Decrement quantity
        setInventory((prev) =>
            prev
                .map((inv) =>
                    inv.item.id === itemEntry.item.id
                        ? { ...inv, quantity: inv.quantity - 1 }
                        : inv
                )
                .filter((inv) => inv.quantity > 0)
        );
    };

    // Stage Clear / Save Progress
    const handleSimulateStageClear = async () => {
        if (!activeRun) return;
        const nextDepth = (activeRun.level_reached || 0) + 1;
        const xpGain = Math.round(250 * (journeyConfig.multipliers?.xpMultiplier ?? 1.0));
        const nextScore = (activeRun.score || 0) + xpGain;
        await updateProgress(nextScore, nextDepth);
        showNotification(`✓ Progress Saved! Reached Depth ${nextDepth} (+${xpGain} XP)`);
    };

    // Finish Run
    const handleFinishRun = async () => {
        if (!activeRun) return;
        await completeActiveRun(activeRun.score || 0, activeRun.level_reached || 0);
        navigate("/continue-journey");
    };

    return (
        <div
            className="min-h-screen bg-[#070c0a] text-white p-4 md:p-8 font-mono flex flex-col justify-between select-none relative"
            style={{ fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'` }}
        >
            {/* Dev Console Component */}
            <DevConsole
                isOpen={isConsoleOpen}
                onClose={() => setIsConsoleOpen(false)}
                player={player}
                setPlayer={setPlayer}
                enemies={enemies}
                setEnemies={setEnemies}
                inventory={inventory}
                setInventory={setInventory}
                onAddLog={(log) => console.log("[DevConsole]", log)}
            />

            {/* Top Bar */}
            <div className="flex justify-between items-center text-xs tracking-widest uppercase border-b border-[#1b2b23] pb-4">
                <Link
                    to="/"
                    className="px-3 py-1.5 bg-black/60 border border-[#2b3a2a] text-[#789077] hover:text-[#b9f046] hover:border-[#b9f046] transition-colors"
                >
                    ← RETREAT TO MAIN MENU
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsConsoleOpen((prev) => !prev)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition-all ${
                            isConsoleOpen
                                ? "bg-[#b9f046] text-black border-[#b9f046]"
                                : "bg-black/60 text-[#b9f046] border-[#293d33] hover:border-[#b9f046]"
                        }`}
                    >
                        {isConsoleOpen ? "HIDE CONSOLE [`]" : "DEV CONSOLE [`]"}
                    </button>

                    {journeyConfig.cheatsEnabled && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px]">
                            CHEATS ENABLED
                        </span>
                    )}

                    <span className="text-[#8ca872]">
                        RUN #{activeRun ? activeRun.id : "OFFLINE"}
                    </span>
                </div>
            </div>

            {/* Main Arena Workspace */}
            <main className="flex-1 flex flex-col items-center justify-center my-6 max-w-5xl mx-auto w-full">
                {feedback && (
                    <div className="mb-4 px-4 py-2 bg-green-950/90 border border-green-500 text-[#b9f046] text-xs animate-pulse">
                        {feedback}
                    </div>
                )}

                {/* Arena Grid: Left Player / Right Enemies */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-start">
                    {/* Left: Player Combat Card */}
                    <div className="md:col-span-5 p-5 bg-[#0c1613] border-2 border-[#b9f046] shadow-[0_0_20px_rgba(185,240,70,0.2)]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-black/60 border border-[#22352d] flex items-center justify-center text-3xl">
                                {selectedCharacter?.sprite_url ? (
                                    <img
                                        src={selectedCharacter.sprite_url}
                                        alt={player.title}
                                        className="w-full h-full object-contain pixelated"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <span>🐀</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold uppercase text-white">
                                    {player.title}
                                </h2>
                                <div className="text-[10px] text-[#b9f046] uppercase tracking-wider">
                                    DEPTH: {activeRun?.level_reached ?? 0} | SCORE:{" "}
                                    {activeRun?.score ?? 0} XP
                                </div>
                            </div>
                        </div>

                        {/* Health Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs font-mono mb-1">
                                <span className="text-red-400 font-bold">HEALTH</span>
                                <span className="text-white font-bold">{player.currentHp} / {player.maxHp} HP</span>
                            </div>
                            <div className="w-full bg-[#14201c] h-3 overflow-hidden border border-[#20332c]">
                                <div
                                    className="bg-red-500 h-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (player.currentHp / player.maxHp) * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Stat grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs border-y border-[#1b2b23] py-2 mb-4">
                            <div>ATK: <span className="text-[#b9f046] font-bold">{player.attack}</span></div>
                            <div>DEF: <span className="text-blue-400 font-bold">{player.defense}</span></div>
                            <div>CRIT: <span className="text-yellow-400 font-bold">{player.crit_chance}%</span></div>
                            <div>
                                PIERCE:{" "}
                                <span className={player.armor_piercing ? "text-yellow-300 font-bold" : "text-[#556954]"}>
                                    {player.armor_piercing ? "YES" : "NO"}
                                </span>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div>
                            <div className="text-[11px] text-[#8ca872] uppercase font-bold tracking-wider mb-2">
                                Inventory Items:
                            </div>
                            {inventory.length === 0 ? (
                                <div className="text-[10px] text-[#556954] italic">
                                    Pockets are empty. (Use 'give me bandages' in dev console!)
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {inventory.map((inv) => (
                                        <div
                                            key={inv.item.id}
                                            className="flex items-center justify-between p-1.5 bg-[#14201c] border border-[#23352c] text-[10px]"
                                        >
                                            <div>
                                                <span className="font-bold text-white">{inv.item.name}</span>
                                                <span className="text-[#b9f046] ml-1.5">x{inv.quantity}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleUseItem(inv)}
                                                className="px-2 py-0.5 bg-[#b9f046] text-black font-bold uppercase hover:bg-[#d2ff6b]"
                                            >
                                                USE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Enemies Encounter in Arena */}
                    <div className="md:col-span-7 p-5 bg-[#0a110f] border border-[#22352d] flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#182620]">
                                <div className="text-xs text-[#8ca872] uppercase font-bold tracking-wider">
                                    ENEMIES IN SIGHT ({enemies.length})
                                </div>
                                <div className="text-[10px] text-[#556954]">
                                    TYPE 'spawn enemy rat_king 1' IN CONSOLE
                                </div>
                            </div>

                            {enemies.length === 0 ? (
                                <div className="py-16 text-center text-[#556954] text-xs">
                                    <div className="text-3xl mb-2">🐀✨</div>
                                    The sewer is quiet. No foes are currently engaged.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                                    {enemies.map((enemy) => (
                                        <div
                                            key={enemy.id}
                                            className={`p-3 border ${
                                                enemy.isBoss
                                                    ? "bg-[#1f1111] border-red-600 shadow-[0_0_10px_rgba(255,0,0,0.3)]"
                                                    : "bg-[#111917] border-[#22352d]"
                                            } text-xs space-y-1.5`}
                                        >
                                            <div className="flex justify-between items-center font-bold">
                                                <span className={enemy.isBoss ? "text-red-400" : "text-white"}>
                                                    {enemy.name}
                                                </span>
                                                {enemy.isBoss && (
                                                    <span className="px-1 py-0.2 bg-red-600/30 text-red-300 text-[9px] border border-red-500/50">
                                                        BOSS
                                                    </span>
                                                )}
                                            </div>

                                            {/* Enemy HP */}
                                            <div className="w-full bg-[#1b2621] h-2 border border-[#2e3e35] overflow-hidden">
                                                <div
                                                    className="bg-red-500 h-full"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, (enemy.currentHp / enemy.maxHp) * 100))}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-[#718570]">
                                                <span>HP: {enemy.currentHp}/{enemy.maxHp}</span>
                                                <span>ATK: {enemy.attack} | DEF: {enemy.defense}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Arena Actions */}
                        <div className="pt-4 border-t border-[#182620] flex flex-wrap gap-2.5 justify-end">
                            <button
                                type="button"
                                onClick={handleSimulateStageClear}
                                disabled={!activeRun}
                                className="px-3.5 py-2 bg-[#14201c] border border-[#293d33] hover:border-[#b9f046] hover:text-[#b9f046] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                            >
                                ⚔ CLEAR STAGE (SAVE PROGRESS)
                            </button>
                            <button
                                type="button"
                                onClick={handleFinishRun}
                                disabled={!activeRun}
                                className="px-3.5 py-2 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-200 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                            >
                                🏆 COMPLETE RUN
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center text-[10px] text-[#556954] tracking-widest uppercase border-t border-[#1b2b23] pt-4 flex justify-between items-center">
                <div>PRESS ` TO TOGGLE DEV CONSOLE</div>
                <div>THE SEWER. THE CROWN.</div>
            </footer>
        </div>
    );
};

export default PlayGamePage;
