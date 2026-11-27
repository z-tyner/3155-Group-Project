/**
 * @file ContinueJourneyPage.tsx
 * @description 'Continue Your Adventure' save slot selection page matching Game UI Mockup Screen 4.
 * Features 3-card carousel of active run saves, progress details, abandon/delete save functionality,
 * keyboard controls (A/D, arrows, Enter, Esc), and audio SFX triggers.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import * as runApi from "../services/runApi.js";
import type { Run } from "../types/game.js";

// Sound effects matching Main Menu
const SFX = {
    select: "/assets/audio/sfx/menu_select.wav",
    confirm: "/assets/audio/sfx/menu_confirm.wav",
};

const playSound = (src: string) => {
    try {
        const audio = new Audio(src);
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch {}
};

function getLocationName(level: number): string {
    if (level <= 0) return "Gutter Outskirts";
    if (level <= 1) return "Sewer Drainpipes";
    if (level <= 2) return "Sewer Poisonings";
    if (level <= 4) return "Grand Laboratory";
    if (level <= 6) return "Toxic Reservoirs";
    return "Rat King's Lair";
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "Unknown";
    }
}

export const ContinueJourneyPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { resumeJourney, abandonJourney } = useGame();

    const [activeSaves, setActiveSaves] = useState<Run[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [abandonConfirmId, setAbandonConfirmId] = useState<number | null>(null);

    // Fetch active (uncompleted) runs for current user
    const loadSaves = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        try {
            const runs = await runApi.getMyRuns();
            // Filter to in-progress runs (completed_at is null)
            const inProgress = (runs || []).filter((r) => !r.completed_at);
            setActiveSaves(inProgress);
            setSelectedIndex(0);
        } catch (err: any) {
            console.error("Failed to load active runs:", err);
            setErrorMessage(err.message || "Failed to load active save files.");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadSaves();
    }, [loadSaves]);

    const currentSave = activeSaves[selectedIndex] || null;

    // Navigation cycle helpers
    const handlePrev = useCallback(() => {
        if (activeSaves.length <= 1) return;
        playSound(SFX.select);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeSaves.length - 1));
        setAbandonConfirmId(null);
    }, [activeSaves.length]);

    const handleNext = useCallback(() => {
        if (activeSaves.length <= 1) return;
        playSound(SFX.select);
        setSelectedIndex((prev) => (prev < activeSaves.length - 1 ? prev + 1 : 0));
        setAbandonConfirmId(null);
    }, [activeSaves.length]);

    // Resume chosen save
    const handleResume = useCallback(async () => {
        if (!currentSave) return;
        playSound(SFX.confirm);
        setActionLoading(true);
        setErrorMessage(null);

        try {
            await resumeJourney(currentSave.id);
            navigate("/play");
        } catch (err: any) {
            setErrorMessage(err.message || "Could not resume this journey.");
            setActionLoading(false);
        }
    }, [currentSave, resumeJourney, navigate]);

    // Abandon chosen save
    const handleAbandon = useCallback(
        async (runId: number) => {
            playSound(SFX.confirm);
            setActionLoading(true);
            try {
                await abandonJourney(runId);
                setAbandonConfirmId(null);
                await loadSaves();
            } catch (err: any) {
                setErrorMessage(err.message || "Failed to abandon save burrow.");
            } finally {
                setActionLoading(false);
            }
        },
        [abandonJourney, loadSaves]
    );

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                e.preventDefault();
                handlePrev();
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (currentSave) handleResume();
            } else if (e.key === "Escape") {
                e.preventDefault();
                navigate("/");
            } else if (e.key === "Delete" || e.key === "Backspace") {
                if (currentSave) {
                    e.preventDefault();
                    setAbandonConfirmId((prev) => (prev === currentSave.id ? null : currentSave.id));
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handlePrev, handleNext, handleResume, navigate, currentSave]);

    // Render helper for visible 3-card slots (Prev, Active, Next)
    const visibleCards = useMemo(() => {
        if (activeSaves.length === 0) return [];
        if (activeSaves.length === 1) {
            return [{ run: activeSaves[0], index: 0, slot: "center" }];
        }
        if (activeSaves.length === 2) {
            return [
                { run: activeSaves[selectedIndex], index: selectedIndex, slot: "center" },
                {
                    run: activeSaves[selectedIndex === 0 ? 1 : 0],
                    index: selectedIndex === 0 ? 1 : 0,
                    slot: "right",
                },
            ];
        }
        const prevIdx = (selectedIndex - 1 + activeSaves.length) % activeSaves.length;
        const nextIdx = (selectedIndex + 1) % activeSaves.length;
        return [
            { run: activeSaves[prevIdx], index: prevIdx, slot: "left" },
            { run: activeSaves[selectedIndex], index: selectedIndex, slot: "center" },
            { run: activeSaves[nextIdx], index: nextIdx, slot: "right" },
        ];
    }, [activeSaves, selectedIndex]);

    return (
        <div
            className="min-h-screen bg-[#070c0a] text-[#b6c7b5] flex flex-col justify-between p-6 md:p-10 select-none overflow-x-hidden"
            style={{ fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'` }}
        >
            {/* Background Atmosphere Layer */}
            <div
                className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center"
                style={{
                    backgroundImage: `url("/assets/backgrounds/main_menu_bg.png")`,
                    backgroundColor: "#070c0a",
                }}
            />

            {/* CRT scanlines effect */}
            <div
                className="fixed inset-0 pointer-events-none opacity-25"
                style={{
                    background:
                        "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
                    backgroundSize: "100% 4px",
                }}
            />

            {/* Header: [ ESC ] Back & Tag */}
            <header className="relative z-10 flex justify-between items-center text-xs tracking-widest uppercase">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-[#2b3a2a] text-[#789077] hover:text-[#b9f046] hover:border-[#b9f046] transition-colors"
                >
                    <span>[ ESC ]</span>
                    <span>BACK</span>
                </button>
                <div className="flex items-center gap-2 text-[#789077] bg-black/60 px-3 py-1.5 border border-[#2b3a2a]">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#b9f046] animate-pulse" />
                    <span>CONTINUE</span>
                </div>
            </header>

            {/* Page Header Titles */}
            <section className="relative z-10 text-center my-4">
                <h1 className="text-3xl md:text-5xl font-black tracking-wider text-[#b9f046] uppercase drop-shadow-[0_2px_10px_rgba(185,240,70,0.3)]">
                    Continue Your Adventure
                </h1>
                <p className="text-xs md:text-sm text-[#789077] mt-2 tracking-widest uppercase">
                    Many rats make their journey for the crown. Which is yours?
                </p>
                {errorMessage && (
                    <div className="mt-3 inline-block px-4 py-2 bg-red-950/80 border border-red-600 text-red-200 text-xs">
                        {errorMessage}
                    </div>
                )}
            </section>

            {/* Main Interactive Carousel Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-[#8ca872] tracking-widest text-sm animate-pulse">
                        [ SCOUTING ACTIVE BURROWS... ]
                    </div>
                ) : !isAuthenticated ? (
                    <div className="p-8 bg-[#0c1613] border border-[#22352d] text-center max-w-md">
                        <p className="text-xs text-[#9cb19e] mb-4">
                            Log in to access your saved burrows across the sewers.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="px-6 py-2.5 bg-[#b9f046] text-black font-bold text-xs uppercase hover:bg-[#d2ff6b]"
                        >
                            LOG IN TO RESUME
                        </button>
                    </div>
                ) : activeSaves.length === 0 ? (
                    /* Empty state matching user mockup */
                    <div className="p-8 bg-[#0c1613]/90 border border-[#22352d] text-center max-w-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <div className="text-4xl mb-4">🕳️</div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
                            No Active Save Burrow Found
                        </h2>
                        <p className="text-xs text-[#789077] mb-6 leading-relaxed">
                            No incomplete runs found. Venture forth into the dark sewer and clear a level to save your progress!
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/new-journey")}
                            className="px-6 py-3 bg-[#b9f046] text-black font-bold text-xs tracking-wider uppercase hover:bg-[#d2ff6b] transition-transform hover:scale-105"
                        >
                            START NEW JOURNEY ▶
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative w-full flex items-center justify-center gap-4 md:gap-8 my-2">
                            {/* Left Carousel Arrow */}
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={activeSaves.length <= 1}
                                className="z-20 p-3 md:p-4 bg-[#111917]/90 border border-[#2e4238] text-[#9cb19e] hover:bg-[#b9f046] hover:text-black hover:border-[#b9f046] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                aria-label="Previous Save"
                            >
                                ◀
                            </button>

                            {/* 3 Cards Container */}
                            <div className="flex items-center justify-center gap-4 md:gap-6 w-full max-w-4xl">
                                {visibleCards.map(({ run, index, slot }) => {
                                    const isCenter = slot === "center";
                                    const locationName = getLocationName(run.level_reached);
                                    const isConfirmingAbandon = abandonConfirmId === run.id;

                                    return (
                                        <div
                                            key={`${run.id}-${index}-${slot}`}
                                            onClick={() => {
                                                if (!isCenter) {
                                                    playSound(SFX.select);
                                                    setSelectedIndex(index);
                                                    setAbandonConfirmId(null);
                                                }
                                            }}
                                            className={`
                                                transition-all duration-200 cursor-pointer flex flex-col justify-between
                                                ${
                                                    isCenter
                                                        ? "w-[300px] md:w-[360px] h-[460px] md:h-[490px] bg-[#0c1613] border-2 border-[#b9f046] shadow-[0_0_25px_rgba(185,240,70,0.25)] scale-100 z-10"
                                                        : "hidden md:flex w-[240px] h-[390px] bg-[#09110e]/70 border border-[#1b2b23] opacity-50 hover:opacity-80 scale-95"
                                                }
                                                p-5 relative
                                            `}
                                        >
                                            {/* Selected Badge */}
                                            {isCenter && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#b9f046] text-black font-bold text-[10px] tracking-widest uppercase">
                                                    ★ SELECTED
                                                </div>
                                            )}

                                            {/* Card Header & Rat Icon */}
                                            <div className="flex flex-col items-center">
                                                <div className="text-[10px] text-[#789077] tracking-widest uppercase mb-1">
                                                    SAVE BURROW #{index + 1}
                                                </div>
                                                <div className="w-20 h-20 md:w-24 md:h-24 bg-black/60 border border-[#22352d] flex items-center justify-center text-4xl md:text-5xl mb-3 overflow-hidden">
                                                    {run.character_sprite ? (
                                                        <img
                                                            src={run.character_sprite}
                                                            alt={run.character_title || "Rat"}
                                                            className="w-full h-full object-contain pixelated"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>🐀</span>
                                                    )}
                                                </div>

                                                <h2 className="text-xl font-bold tracking-widest uppercase text-white">
                                                    {run.character_title || "Lone Rat"}
                                                </h2>
                                                <span className="text-[11px] text-[#b9f046] tracking-wider uppercase font-bold mt-1">
                                                    {locationName}
                                                </span>
                                            </div>

                                            {/* Save Progress Details */}
                                            <div className="space-y-2.5 text-xs font-mono my-2 border-y border-[#182620] py-3 bg-[#08100e]/50 px-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#789077]">LEVEL DEPTH</span>
                                                    <span className="text-white font-bold">
                                                        DEPTH {run.level_reached}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[#789077]">EXP / SCORE</span>
                                                    <span className="text-[#b9f046] font-bold">
                                                        {run.score.toLocaleString()} XP
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-[#556954]">LAST SEEN</span>
                                                    <span className="text-[#9cb19e]">
                                                        {formatDate(run.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Abandon / Delete Run Button */}
                                            {isCenter && (
                                                <div className="pt-2">
                                                    {isConfirmingAbandon ? (
                                                        <div className="bg-red-950/90 border border-red-600 p-2 text-center text-[10px] space-y-1.5 animate-fadeIn">
                                                            <div className="text-red-200 font-bold uppercase">
                                                                PERMANENTLY COLLAPSE BURROW?
                                                            </div>
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAbandon(run.id);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-red-600 text-white font-bold hover:bg-red-500 uppercase"
                                                                >
                                                                    YES, COLLAPSE
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAbandonConfirmId(null);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-[#14201c] text-[#9cb19e] hover:text-white uppercase"
                                                                >
                                                                    CANCEL
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAbandonConfirmId(run.id);
                                                            }}
                                                            className="w-full py-1 text-[10px] text-[#556954] hover:text-red-400 border border-transparent hover:border-red-900 tracking-wider uppercase transition-colors"
                                                        >
                                                            ✕ ABANDON BURROW
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Carousel Arrow */}
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={activeSaves.length <= 1}
                                className="z-20 p-3 md:p-4 bg-[#111917]/90 border border-[#2e4238] text-[#9cb19e] hover:bg-[#b9f046] hover:text-black hover:border-[#b9f046] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                aria-label="Next Save"
                            >
                                ▶
                            </button>
                        </div>

                        {/* Primary Resume Action Button (Matching Mockup Screen 4) */}
                        <div className="mt-6 flex flex-col items-center">
                            <button
                                type="button"
                                disabled={actionLoading || !currentSave}
                                onClick={handleResume}
                                className={`
                                    px-10 py-3.5 bg-[#b9f046] text-[#0d1406] font-black text-sm md:text-base tracking-widest uppercase
                                    border-2 border-[#e0ff88] shadow-[0_0_20px_rgba(185,240,70,0.4)]
                                    hover:bg-[#d2ff6b] hover:scale-105 active:scale-95 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                {actionLoading ? "DESCENDING..." : "▶ Continue Journey"}
                            </button>
                        </div>
                    </>
                )}
            </main>

            {/* Footer Hints (Matching Mockup Screen 4) */}
            <footer className="relative z-10 pt-4 border-t border-[#1b2b23] flex flex-col md:flex-row justify-between items-center text-[10px] text-[#6d826c] tracking-widest uppercase gap-2">
                <div className="flex items-center gap-4">
                    <span>[ A / D ] CHOOSE YOUR SAVE</span>
                    <span>[ ENTER ] TO BEGIN</span>
                    <span>[ DEL ] ABANDON</span>
                </div>
                <div>THE SEWER. THE CROWN.</div>
            </footer>
        </div>
    );
};

export default ContinueJourneyPage;
