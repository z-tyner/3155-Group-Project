/**
 * @file CombatActionMenu.tsx
 * @description UI action menu component allowing the player on their turn to choose between Combat (offensive attacks with target selection, or defensive shields) and Item usage.
 */

import React, { useState } from "react";
import { CombatAction } from "../../types/action.js";
import { EnemyBattleState, InventoryItem } from "../../types/game.js";

interface CombatActionMenuProps {
    isPlayerTurn: boolean;
    actions: CombatAction[];
    inventory: InventoryItem[];
    enemies: EnemyBattleState[];
    onSelectAction: (action: CombatAction, targetEnemyId?: string) => void;
    onUseItem: (item: InventoryItem, targetEnemyId?: string) => void;
}

export const CombatActionMenu: React.FC<CombatActionMenuProps> = ({
    isPlayerTurn,
    actions,
    inventory,
    enemies,
    onSelectAction,
    onUseItem,
}) => {
    const [mode, setMode] = useState<"combat" | "item">("combat");
    const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);

    const livingEnemies = enemies.filter((e) => e.currentHp > 0);

    const handleActionClick = (action: CombatAction) => {
        if (!isPlayerTurn) return;

        if (action.category === "defensive" || action.targetType === "self") {
            onSelectAction(action);
            setSelectedAction(null);
            return;
        }

        if (livingEnemies.length === 1) {
            onSelectAction(action, livingEnemies[0].id);
            setSelectedAction(null);
            return;
        }

        // Offensive action with multiple foes: prompt for enemy target selection
        setSelectedAction(action);
    };

    const handleEnemyTargetClick = (enemyId: string) => {
        if (!isPlayerTurn || !selectedAction) return;
        onSelectAction(selectedAction, enemyId);
        setSelectedAction(null);
    };

    return (
        <div className="combat-action-menu border-2 border-[#22352d] bg-[#0c1613] text-[#b6c7b5] p-4 font-mono">
            {/* Turn Choice: Combat vs. Item */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#182620]">
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={!isPlayerTurn}
                        onClick={() => {
                            setMode("combat");
                            setSelectedAction(null);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors disabled:opacity-40 ${
                            mode === "combat"
                                ? "bg-[#b9f046] text-black border-[#b9f046]"
                                : "bg-[#14201c] text-[#789077] border-[#293d33] hover:text-white"
                        }`}
                    >
                        ⚔ Combat
                    </button>
                    <button
                        type="button"
                        disabled={!isPlayerTurn}
                        onClick={() => {
                            setMode("item");
                            setSelectedAction(null);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors disabled:opacity-40 ${
                            mode === "item"
                                ? "bg-[#b9f046] text-black border-[#b9f046]"
                                : "bg-[#14201c] text-[#789077] border-[#293d33] hover:text-white"
                        }`}
                    >
                        🎒 Items ({inventory.length})
                    </button>
                </div>

                <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        isPlayerTurn
                            ? "text-[#b9f046] border-[#b9f046]/50 bg-[#b9f046]/10"
                            : "text-yellow-300 border-yellow-500/40 bg-yellow-500/10 animate-pulse"
                    }`}
                >
                    {isPlayerTurn ? "YOUR TURN" : "ENEMY TURN..."}
                </span>
            </div>

            {/* Combat Actions List */}
            {mode === "combat" && !selectedAction && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {actions.map((act) => (
                        <button
                            key={act.id}
                            type="button"
                            disabled={!isPlayerTurn || (act.category === "offensive" && livingEnemies.length === 0)}
                            onClick={() => handleActionClick(act)}
                            className="p-2.5 bg-[#111917] hover:bg-[#16241f] border border-[#24382f] hover:border-[#b9f046] text-left transition flex flex-col justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-white uppercase tracking-wide">
                                    {act.name}
                                </span>
                                <span
                                    className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                                        act.category === "defensive"
                                            ? "bg-blue-950/60 text-blue-300 border-blue-700/50"
                                            : "bg-red-950/60 text-red-300 border-red-700/50"
                                    }`}
                                >
                                    {act.category}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#789077] mb-1.5 leading-snug">{act.description}</p>
                            <div className="text-[10px] text-[#9cb19e] flex flex-wrap gap-3">
                                <span>ACC: {act.accuracy}%</span>
                                {act.basePower !== undefined && <span>PWR: {act.basePower}x</span>}
                                {act.armorPiercing && <span className="text-yellow-300">PIERCE</span>}
                                {act.shieldAmount && <span className="text-blue-300">SHIELD: +{act.shieldAmount}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Target Selection Prompt for Offensive Actions */}
            {mode === "combat" && selectedAction && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                            Select target for {selectedAction.name}:
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedAction(null)}
                            className="text-[11px] text-[#8ca872] underline hover:text-white uppercase"
                        >
                            [ Cancel ]
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {livingEnemies.map((enemy) => (
                            <button
                                key={enemy.id}
                                type="button"
                                disabled={!isPlayerTurn}
                                onClick={() => handleEnemyTargetClick(enemy.id)}
                                className="p-2.5 bg-[#1a1111] border border-red-800/70 hover:border-[#b9f046] hover:bg-[#241616] text-xs text-left transition"
                            >
                                <div className="flex justify-between items-center font-bold text-white">
                                    <span>{enemy.name}</span>
                                    {enemy.isBoss && (
                                        <span className="text-[9px] px-1 bg-red-600/30 text-red-300 border border-red-500/50">
                                            BOSS
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-[#9cb19e] mt-1">
                                    HP: {enemy.currentHp} / {enemy.maxHp} · DEF: {enemy.defense}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Item List */}
            {mode === "item" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {inventory.length === 0 ? (
                        <p className="text-xs text-[#556954] italic col-span-2 py-4 text-center">
                            No items in inventory.
                        </p>
                    ) : (
                        inventory.map((invItem) => (
                            <button
                                key={invItem.item.id}
                                type="button"
                                disabled={!isPlayerTurn || invItem.quantity <= 0}
                                onClick={() => onUseItem(invItem)}
                                className="p-2.5 bg-[#111917] hover:bg-[#16241f] border border-[#24382f] hover:border-[#b9f046] text-left transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <div className="flex justify-between font-bold text-xs text-white mb-1">
                                    <span>{invItem.item.name}</span>
                                    <span className="text-[#b9f046]">x{invItem.quantity}</span>
                                </div>
                                <p className="text-[11px] text-[#789077]">{invItem.item.description}</p>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
