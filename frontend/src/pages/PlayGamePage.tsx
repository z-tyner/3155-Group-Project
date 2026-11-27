/**
 * @file PlayGamePage.tsx
 * @description In-game gameplay arena and battle runner showing active journey session from GameContext.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";

export const PlayGamePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        activeRun,
        selectedCharacter,
        journeyConfig,
        updateProgress,
        completeActiveRun,
    } = useGame();

    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSimulateStageClear = async () => {
        if (!activeRun) return;
        const nextDepth = (activeRun.level_reached || 0) + 1;
        const nextScore = (activeRun.score || 0) + 250;
        await updateProgress(nextScore, nextDepth);
        setFeedback(`✓ Progress Saved! Reached Depth ${nextDepth} (${nextScore} XP)`);
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleFinishRun = async () => {
        if (!activeRun) return;
        await completeActiveRun(activeRun.score || 0, activeRun.level_reached || 0);
        navigate("/continue-journey");
    };

    return (
        <div
            className="min-h-screen bg-[#070c0a] text-white p-6 md:p-10 font-mono flex flex-col justify-between"
            style={{ fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'` }}
        >
            {/* Header */}
            <div className="flex justify-between items-center text-xs tracking-widest uppercase border-b border-[#1b2b23] pb-4">
                <Link
                    to="/"
                    className="px-3 py-1.5 bg-black/60 border border-[#2b3a2a] text-[#789077] hover:text-[#b9f046] hover:border-[#b9f046]"
                >
                    ← RETREAT TO MAIN MENU
                </Link>
                <div className="flex items-center gap-3">
                    {journeyConfig.cheatsEnabled && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px]">
                            CHEATS ACTIVE
                        </span>
                    )}
                    <span className="text-[#8ca872]">
                        RUN #{activeRun ? activeRun.id : "OFFLINE"}
                    </span>
                </div>
            </div>

            {/* Arena / Character Status */}
            <div className="flex flex-col items-center justify-center my-8 text-center max-w-2xl mx-auto w-full">
                <h1 className="text-3xl md:text-5xl font-black text-[#b9f046] uppercase mb-2 tracking-wider drop-shadow-[0_0_15px_rgba(185,240,70,0.3)]">
                    INTO THE SEWERS
                </h1>
                <p className="text-xs text-[#789077] uppercase tracking-widest mb-8">
                    Battle arena active. Turn-based combat engine standing by.
                </p>

                {/* Active Hero Card */}
                {selectedCharacter ? (
                    <div className="w-full max-w-md p-6 bg-[#0c1613] border-2 border-[#b9f046] shadow-[0_0_20px_rgba(185,240,70,0.2)] mb-6 text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-black/60 border border-[#22352d] flex items-center justify-center text-3xl">
                                {selectedCharacter.sprite_url ? (
                                    <img
                                        src={selectedCharacter.sprite_url}
                                        alt={selectedCharacter.title}
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
                                    {selectedCharacter.title}
                                </h2>
                                <div className="text-[10px] text-[#b9f046] uppercase tracking-wider">
                                    CURRENT DEPTH: {activeRun?.level_reached ?? 0} | SCORE:{" "}
                                    {activeRun?.score ?? 0} XP
                                </div>
                            </div>
                        </div>

                        {/* Stat grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#1b2b23] pt-3">
                            <div>HP: <span className="text-red-400 font-bold">{selectedCharacter.hp}</span></div>
                            <div>ATK: <span className="text-[#b9f046] font-bold">{selectedCharacter.attack}</span></div>
                            <div>DEF: <span className="text-blue-400 font-bold">{selectedCharacter.defense}</span></div>
                            <div>CRIT: <span className="text-yellow-400 font-bold">{selectedCharacter.crit_chance}%</span></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-[#6d826c] mb-6">
                        No active rat loaded in session.
                    </div>
                )}

                {feedback && (
                    <div className="mb-4 px-4 py-2 bg-green-950/80 border border-green-500 text-[#b9f046] text-xs animate-pulse">
                        {feedback}
                    </div>
                )}

                {/* Quick Simulation Actions for Development/Testing */}
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        type="button"
                        onClick={handleSimulateStageClear}
                        disabled={!activeRun}
                        className="px-4 py-2.5 bg-[#14201c] border border-[#293d33] hover:border-[#b9f046] hover:text-[#b9f046] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                    >
                        ⚔ CLEAR STAGE (SAVE PROGRESS)
                    </button>
                    <button
                        type="button"
                        onClick={handleFinishRun}
                        disabled={!activeRun}
                        className="px-4 py-2.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-200 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                    >
                        🏆 FINISH / RETIRE RUN
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-[#556954] tracking-widest uppercase border-t border-[#1b2b23] pt-4">
                THE SEWER. THE CROWN.
            </div>
        </div>
    );
};

export default PlayGamePage;
