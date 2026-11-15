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
    onUseItem
}) => {
    const [mode, setMode] = useState<"combat" | "item">("combat");
    const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);

    const handleActionClick = (action: CombatAction) => {
        if (!isPlayerTurn) return;

        if (action.category === "defensive" || action.targetType === "self") {
            onSelectAction(action);
            setSelectedAction(null);
            return;
        }

        // Offensive action: prompt for enemy target selection
        setSelectedAction(action);
    };

    const handleEnemyTargetClick = (enemyId: string) => {
        if (selectedAction) {
            onSelectAction(selectedAction, enemyId);
            setSelectedAction(null);
        }
    };

    return (
        <div className="combat-action-menu border rounded p-4 bg-slate-900 text-white">
            {/* Turn Choice: Combat vs. Item */}
            <div className="flex gap-4 mb-4">
                <button
                    disabled={!isPlayerTurn}
                    onClick={() => {
                        setMode("combat");
                        setSelectedAction(null);
                    }}
                    className={`px-4 py-2 font-bold rounded ${
                        mode === "combat" ? "bg-red-600 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                >
                    Combat
                </button>
                <button
                    disabled={!isPlayerTurn}
                    onClick={() => {
                        setMode("item");
                        setSelectedAction(null);
                    }}
                    className={`px-4 py-2 font-bold rounded ${
                        mode === "item" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                >
                    Items ({inventory.length})
                </button>
            </div>

            {/* Combat Actions List */}
            {mode === "combat" && !selectedAction && (
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((act) => (
                        <button
                            key={act.id}
                            disabled={!isPlayerTurn}
                            onClick={() => handleActionClick(act)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-left transition flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg">{act.name}</span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                        act.category === "defensive"
                                            ? "bg-blue-900 text-blue-200"
                                            : "bg-red-900 text-red-200"
                                    }`}
                                >
                                    {act.category}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{act.description}</p>
                            <div className="text-xs text-slate-300 flex gap-3">
                                <span>Accuracy: {act.accuracy}%</span>
                                {act.armorPiercing && <span className="text-yellow-400">Piercing</span>}
                                {act.shieldAmount && <span className="text-blue-400">Shield: +{act.shieldAmount}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Target Selection Prompt for Offensive Actions */}
            {mode === "combat" && selectedAction && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-yellow-300">
                            Select a target for {selectedAction.name}:
                        </span>
                        <button
                            onClick={() => setSelectedAction(null)}
                            className="text-xs text-slate-400 underline hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {enemies
                            .filter((e) => e.currentHp > 0)
                            .map((enemy) => (
                                <button
                                    key={enemy.id}
                                    onClick={() => handleEnemyTargetClick(enemy.id)}
                                    className="p-3 bg-red-950 border border-red-700 hover:bg-red-900 rounded text-sm text-left flex-1"
                                >
                                    <div className="font-bold">{enemy.name}</div>
                                    <div className="text-xs text-slate-300">
                                        HP: {enemy.currentHp} / {enemy.maxHp}
                                    </div>
                                    <div className="text-xs text-slate-400">DEF: {enemy.defense}</div>
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* Item List */}
            {mode === "item" && (
                <div className="grid grid-cols-2 gap-3">
                    {inventory.length === 0 ? (
                        <p className="text-sm text-slate-400 col-span-2">No items in inventory.</p>
                    ) : (
                        inventory.map((invItem) => (
                            <button
                                key={invItem.item.id}
                                disabled={!isPlayerTurn || invItem.quantity <= 0}
                                onClick={() => onUseItem(invItem)}
                                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-left transition"
                            >
                                <div className="flex justify-between font-semibold">
                                    <span>{invItem.item.name}</span>
                                    <span>x{invItem.quantity}</span>
                                </div>
                                <p className="text-xs text-slate-400">{invItem.item.description}</p>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
