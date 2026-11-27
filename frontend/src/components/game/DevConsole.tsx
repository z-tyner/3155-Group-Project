/**
 * @file DevConsole.tsx
 * @description In-game developer & cheat console toggled by backtick (`).
 * Parses commands to spawn enemies, give items, modify health, and adjust combat stats.
 */

import React, { useState, useEffect, useRef } from "react";
import type { PlayerBattleState, EnemyBattleState } from "../../types/game.js";
import type { InventoryItem, Item } from "../../types/item.js";

interface ConsoleLog {
    id: string;
    type: "command" | "success" | "error" | "info";
    text: string;
}

export interface DevConsoleProps {
    isOpen: boolean;
    onClose: () => void;
    player: PlayerBattleState;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerBattleState>>;
    enemies: EnemyBattleState[];
    setEnemies: React.Dispatch<React.SetStateAction<EnemyBattleState[]>>;
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    onAddLog?: (message: string) => void;
}

// Preset enemy templates
const ENEMY_TEMPLATES: Record<string, Partial<EnemyBattleState>> = {
    rat_ogre: {
        name: "Rat Ogre",
        currentHp: 180,
        maxHp: 180,
        attack: 24,
        defense: 14,
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
        attack: 30,
        defense: 20,
        crit_chance: 20,
        armor_piercing: true,
        accuracy: 90,
        itemDropChance: 100,
        xpDropAmount: 500,
        isBoss: true,
        spriteUrl: "/assets/enemies/idle/rat_king.png",
    },
    sewer_rat: {
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
    toxic_slime: {
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
    plague_bat: {
        name: "Plague Bat",
        currentHp: 35,
        maxHp: 35,
        attack: 12,
        defense: 2,
        crit_chance: 25,
        armor_piercing: false,
        accuracy: 95,
        itemDropChance: 20,
        xpDropAmount: 35,
        isBoss: false,
        spriteUrl: "/assets/enemies/idle/bat.png",
    },
};

// Item catalog for 'give me <item>'
const ITEM_CATALOG: Record<string, Item> = {
    bandages: {
        id: 101,
        name: "Bandages",
        description: "Restores 35 HP immediately.",
        effect_type: "heal",
        value: 35,
        rarity: "common",
    },
    bandage: {
        id: 101,
        name: "Bandages",
        description: "Restores 35 HP immediately.",
        effect_type: "heal",
        value: 35,
        rarity: "common",
    },
    cheese: {
        id: 102,
        name: "Aged Cheese",
        description: "Nutritious sewer delicacy. Heals 60 HP.",
        effect_type: "heal",
        value: 60,
        rarity: "uncommon",
    },
    poison_vial: {
        id: 103,
        name: "Poison Vial",
        description: "Deals 40 true damage to target enemy.",
        effect_type: "damage",
        value: 40,
        rarity: "uncommon",
    },
    iron_shield: {
        id: 104,
        name: "Iron Shield",
        description: "Grants 30 shield mitigation for next turn.",
        effect_type: "shield",
        value: 30,
        rarity: "rare",
    },
    smoke_bomb: {
        id: 105,
        name: "Smoke Bomb",
        description: "Blinds enemies and raises evasion.",
        effect_type: "buff",
        value: 20,
        rarity: "rare",
    },
};

export const DevConsole: React.FC<DevConsoleProps> = ({
    isOpen,
    onClose,
    player,
    setPlayer,
    enemies,
    setEnemies,
    inventory,
    setInventory,
    onAddLog,
}) => {
    const [input, setInput] = useState<string>("");
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [logs, setLogs] = useState<ConsoleLog[]>([
        {
            id: "init-1",
            type: "info",
            text: "Rat King Dev Console Initialized. Type 'help' for command syntax.",
        },
    ]);

    const inputRef = useRef<HTMLInputElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Scroll to bottom of log output
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    const addLog = (type: ConsoleLog["type"], text: string) => {
        const newLog: ConsoleLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type,
            text,
        };
        setLogs((prev) => [...prev, newLog]);
        if (onAddLog) onAddLog(text);
    };

    // Command parser
    const handleCommand = (rawCommand: string) => {
        const trimmed = rawCommand.trim();
        if (!trimmed) return;

        addLog("command", `> ${trimmed}`);
        setHistory((prev) => [...prev, trimmed]);
        setHistoryIndex(-1);
        setInput("");

        const lower = trimmed.toLowerCase();
        const parts = lower.split(/\s+/);

        // 1. HELP
        if (lower === "help") {
            addLog("info", "--- AVAILABLE CHEAT COMMANDS ---");
            addLog("info", "• spawn enemy <name> <count> : (e.g. 'spawn enemy rat_ogre 1', 'spawn enemy rat_king 52')");
            addLog("info", "• health me <amount>        : (e.g. 'health me 100', 'health me 999')");
            addLog("info", "• give me <item>            : (e.g. 'give me bandages', 'give me cheese', 'give me poison_vial')");
            addLog("info", "• stat me <stat> <value>    : (e.g. 'stat me attack 50', 'stat me defense 30', 'stat me crit 50')");
            addLog("info", "• kill enemies              : Instantly defeats all spawned enemies");
            addLog("info", "• clear                     : Clears console history");
            return;
        }

        // 2. CLEAR
        if (lower === "clear") {
            setLogs([]);
            return;
        }

        // 3. KILL ENEMIES / KILL ALL
        if (lower === "kill enemies" || lower === "kill all") {
            const count = enemies.length;
            setEnemies([]);
            addLog("success", `Killed ${count} enemies.`);
            return;
        }

        // 4. SPAWN ENEMY <TYPE> <COUNT>
        // Examples: "spawn enemy rat_ogre 1", "spawn enemy rat_king 52"
        if (parts[0] === "spawn" && parts[1] === "enemy" && parts[2]) {
            const enemyKey = parts[2];
            const count = parts[3] ? parseInt(parts[3], 10) : 1;

            if (isNaN(count) || count <= 0) {
                addLog("error", `Invalid enemy count: '${parts[3]}'. Must be a positive integer.`);
                return;
            }

            const template = ENEMY_TEMPLATES[enemyKey] || {
                name: enemyKey
                    .split("_")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" "),
                currentHp: 80,
                maxHp: 80,
                attack: 16,
                defense: 8,
                crit_chance: 10,
                armor_piercing: false,
                accuracy: 85,
                itemDropChance: 30,
                xpDropAmount: 50,
                isBoss: enemyKey.includes("king") || enemyKey.includes("ogre"),
                spriteUrl: `/assets/enemies/idle/${enemyKey}.png`,
            };

            const newEnemies: EnemyBattleState[] = [];
            for (let i = 0; i < count; i++) {
                const uniqueId = `enemy-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
                newEnemies.push({
                    id: uniqueId,
                    name: count > 1 ? `${template.name} #${i + 1}` : (template.name || "Enemy"),
                    currentHp: template.currentHp ?? 80,
                    maxHp: template.maxHp ?? 80,
                    attack: template.attack ?? 15,
                    defense: template.defense ?? 8,
                    crit_chance: template.crit_chance ?? 10,
                    armor_piercing: template.armor_piercing ?? false,
                    accuracy: template.accuracy ?? 85,
                    itemDropChance: template.itemDropChance ?? 30,
                    xpDropAmount: template.xpDropAmount ?? 50,
                    isBoss: template.isBoss ?? false,
                    spriteUrl: template.spriteUrl ?? "/assets/enemies/idle/sewer_rat.png",
                });
            }

            setEnemies((prev) => [...prev, ...newEnemies]);
            addLog("success", `Spawned ${count}x ${template.name}! Total active enemies: ${enemies.length + count}`);
            return;
        }

        // 5. HEALTH ME <AMOUNT>
        // Example: "health me 100"
        if (parts[0] === "health" && parts[1] === "me" && parts[2]) {
            const amount = parseInt(parts[2], 10);
            if (isNaN(amount) || amount < 0) {
                addLog("error", `Invalid health value: '${parts[2]}'. Must be a non-negative number.`);
                return;
            }

            setPlayer((prev) => ({
                ...prev,
                currentHp: amount,
                maxHp: Math.max(prev.maxHp, amount),
            }));
            addLog("success", `Player HP set to ${amount}/${Math.max(player.maxHp, amount)}.`);
            return;
        }

        // 6. GIVE ME <ITEM_NAME> [COUNT]
        // Examples: "give me bandages", "give me cheese 3"
        if (parts[0] === "give" && parts[1] === "me" && parts[2]) {
            const itemKey = parts[2];
            const count = parts[3] ? parseInt(parts[3], 10) : 1;

            if (isNaN(count) || count <= 0) {
                addLog("error", `Invalid item count: '${parts[3]}'.`);
                return;
            }

            const itemDef = ITEM_CATALOG[itemKey] || {
                id: Math.floor(Math.random() * 9000) + 1000,
                name: itemKey
                    .split("_")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" "),
                description: `Sewer provision: ${itemKey}`,
                effect_type: "heal" as const,
                value: 25,
                rarity: "common" as const,
            };

            setInventory((prev) => {
                const existingIdx = prev.findIndex((inv) => inv.item.name.toLowerCase() === itemDef.name.toLowerCase());
                if (existingIdx >= 0) {
                    const copy = [...prev];
                    copy[existingIdx].quantity += count;
                    return copy;
                }
                return [...prev, { item: itemDef, quantity: count }];
            });

            addLog("success", `Granted ${count}x ${itemDef.name} to player inventory.`);
            return;
        }

        // 7. STAT ME <STAT> <VALUE> or STAT <STAT> <VALUE>
        // Examples: "stat me attack 50", "stat defense 30"
        const isStatMe = parts[0] === "stat" && parts[1] === "me" && parts[2];
        const isStatDirect = parts[0] === "stat" && parts[1] && parts[2] && parts[1] !== "me";

        if (isStatMe || isStatDirect) {
            const statName = isStatMe ? parts[2] : parts[1];
            const rawVal = isStatMe ? parts[3] : parts[2];
            const numVal = parseFloat(rawVal);

            if (statName === "attack" || statName === "atk") {
                if (isNaN(numVal)) return addLog("error", "Invalid attack value.");
                setPlayer((prev) => ({ ...prev, attack: numVal }));
                return addLog("success", `Player Attack set to ${numVal}.`);
            }
            if (statName === "defense" || statName === "def") {
                if (isNaN(numVal)) return addLog("error", "Invalid defense value.");
                setPlayer((prev) => ({ ...prev, defense: numVal }));
                return addLog("success", `Player Defense set to ${numVal}.`);
            }
            if (statName === "crit" || statName === "crit_chance") {
                if (isNaN(numVal)) return addLog("error", "Invalid crit value.");
                setPlayer((prev) => ({ ...prev, crit_chance: numVal }));
                return addLog("success", `Player Crit Chance set to ${numVal}%.`);
            }
            if (statName === "speed") {
                const isSpeed = rawVal === "true" || rawVal === "1";
                setPlayer((prev) => ({ ...prev, speed: isSpeed }));
                return addLog("success", `Player Speed initiative set to ${isSpeed}.`);
            }
            if (statName === "piercing" || statName === "armor_piercing") {
                const isPiercing = rawVal === "true" || rawVal === "1";
                setPlayer((prev) => ({ ...prev, armor_piercing: isPiercing }));
                return addLog("success", `Player Armor Piercing set to ${isPiercing}.`);
            }

            addLog("error", `Unknown stat '${statName}'. Supported: attack, defense, crit, speed, piercing.`);
            return;
        }

        // Unrecognized command
        addLog("error", `Unknown command: '${trimmed}'. Type 'help' for command syntax.`);
    };

    // Keyboard handling inside console
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "`") {
            e.preventDefault();
            onClose();
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            handleCommand(input);
            return;
        }

        // Cycle command history Up
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (history.length === 0) return;
            const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(nextIdx);
            setInput(history[nextIdx] || "");
            return;
        }

        // Cycle command history Down
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex === -1) return;
            const nextIdx = historyIndex + 1;
            if (nextIdx >= history.length) {
                setHistoryIndex(-1);
                setInput("");
            } else {
                setHistoryIndex(nextIdx);
                setInput(history[nextIdx] || "");
            }
            return;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-2 md:p-4 select-none pointer-events-auto font-mono text-xs">
            <div className="w-full max-w-4xl bg-black/95 border-2 border-[#b9f046] shadow-[0_0_30px_rgba(185,240,70,0.4)] flex flex-col max-h-[500px]">
                {/* Console Title Bar */}
                <div className="bg-[#14221c] border-b border-[#2b3a2a] px-3 py-1.5 flex justify-between items-center text-[11px] text-[#b9f046] tracking-widest uppercase">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#b9f046] animate-pulse" />
                        <span className="font-bold">RAT KING :: DEV & CHEAT CONSOLE</span>
                        <span className="text-[10px] text-[#718570]">[ PRESS ` OR ESC TO CLOSE ]</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#9cb19e] hover:text-[#b9f046] font-bold px-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Log Stream Output */}
                <div
                    ref={logContainerRef}
                    className="p-3 overflow-y-auto flex-1 space-y-1 bg-[#070d0b] text-[11px] font-mono leading-relaxed max-h-80 min-h-[220px]"
                >
                    {logs.map((log) => {
                        let colorClass = "text-[#b6c7b5]";
                        if (log.type === "command") colorClass = "text-white font-bold";
                        if (log.type === "success") colorClass = "text-[#b9f046] font-bold";
                        if (log.type === "error") colorClass = "text-red-400 font-bold";
                        if (log.type === "info") colorClass = "text-yellow-300";

                        return (
                            <div key={log.id} className={`${colorClass} break-words`}>
                                {log.text}
                            </div>
                        );
                    })}
                </div>

                {/* Input Prompt */}
                <div className="border-t border-[#22352d] bg-[#0c1613] p-2 flex items-center gap-2">
                    <span className="text-[#b9f046] font-bold select-none">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type cheat command (e.g. 'spawn enemy rat_ogre 1', 'health me 100', 'give me bandages')..."
                        className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-[#43574c]"
                    />
                    <button
                        type="button"
                        onClick={() => handleCommand(input)}
                        className="px-3 py-1 bg-[#b9f046] text-black font-bold uppercase text-[10px] hover:bg-[#d2ff6b]"
                    >
                        EXEC
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DevConsole;
