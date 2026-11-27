/**
 * @file NewJourneyPage.tsx
 * @description 'Choose Your Rat' Journey Selection page matching Game UI Mockup Screen 2.
 * Includes interactive 3-card character carousel, audio triggers, keyboard controls (A/D, arrows, Enter, Esc),
 * custom content checkboxes, cheats enabled toggle, and run initialization into /play.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import * as characterApi from "../services/characterApi.js";
import * as cardApi from "../services/cardApi.js";
import type { Character } from "../types/character.js";
import type { Card } from "../types/card.js";
import type { EnemySpawnRate } from "../types/game.js";

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

// Fallback preset rat archetypes if DB is loading or empty
const FALLBACK_PRESETS: Character[] = [
    {
        id: 1,
        user_id: null,
        title: "Pipsqueak",
        hp: 85,
        attack: 22,
        defense: 4,
        crit_chance: 35,
        armor_piercing: true,
        is_preset: true,
        sprite_url: "/assets/characters/idle/pipsqueak.png",
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        user_id: null,
        title: "Skreech",
        hp: 120,
        attack: 16,
        defense: 12,
        crit_chance: 15,
        armor_piercing: false,
        is_preset: true,
        sprite_url: "/assets/characters/idle/skreech.png",
        created_at: new Date().toISOString(),
    },
    {
        id: 3,
        user_id: null,
        title: "Bandicoot",
        hp: 160,
        attack: 12,
        defense: 20,
        crit_chance: 5,
        armor_piercing: false,
        is_preset: true,
        sprite_url: "/assets/characters/idle/bandicoot.png",
        created_at: new Date().toISOString(),
    },
];

// Rat archetype lore & descriptions
const RAT_LORE: Record<string, { tagline: string; description: string; icon: string }> = {
    Pipsqueak: {
        tagline: "LIGHT ON YOUR PAWS",
        description: "Strikes with deadly precision. Ignores enemy armor mitigation.",
        icon: "🗡️",
    },
    Skreech: {
        tagline: "A LITTLE OF EVERYTHING",
        description: "A steady paw in an unsteady world. Balanced offense and resilience.",
        icon: "⚔️",
    },
    Bandicoot: {
        tagline: "TOUGH AS OLD IRON",
        description: "Stand your ground. Hit back harder. Unshakable frontline fortitude.",
        icon: "🛡️",
    },
};

export const NewJourneyPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { startNewJourney, isLoading: isStartingRun } = useGame();

    const [characters, setCharacters] = useState<Character[]>(FALLBACK_PRESETS);
    const [selectedIndex, setSelectedIndex] = useState<number>(1); // Default to Skreech
    const [customCards, setCustomCards] = useState<Card[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
    const [cheatsEnabled, setCheatsEnabled] = useState<boolean>(false);
    const [showConfig, setShowConfig] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Multipliers & gameplay adjustments
    const [xpMultiplier, setXpMultiplier] = useState<number>(1.0);
    const [damageMultiplier, setDamageMultiplier] = useState<number>(1.0);
    const [lootMultiplier, setLootMultiplier] = useState<number>(1.0);

    // Starting individual stat bonuses
    const [hpBonus, setHpBonus] = useState<number>(0);
    const [attackBonus, setAttackBonus] = useState<number>(0);
    const [defenseBonus, setDefenseBonus] = useState<number>(0);
    const [critBonus, setCritBonus] = useState<number>(0);

    // Enemy spawn density
    const [enemySpawnRate, setEnemySpawnRate] = useState<EnemySpawnRate>("normal");

    // Load available characters and custom cards from API
    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            setLoadingData(true);
            try {
                // Fetch characters (presets + user custom rats)
                const charList = await characterApi.getAllCharacters();
                if (isMounted && Array.isArray(charList) && charList.length > 0) {
                    setCharacters(charList);
                    // Locate Skreech if present, else index 0
                    const skreechIdx = charList.findIndex((c) => c.title.toLowerCase() === "skreech");
                    setSelectedIndex(skreechIdx >= 0 ? skreechIdx : 0);
                }
            } catch (err) {
                console.warn("Using fallback rat presets due to fetch error:", err);
            }

            // Fetch custom cards if user logged in
            if (isAuthenticated && user) {
                try {
                    const cards = await cardApi.getAllCards({ user_id: user.id });
                    if (isMounted && Array.isArray(cards)) {
                        setCustomCards(cards);
                        setSelectedCardIds(cards.map((c) => c.id));
                    }
                } catch (err) {
                    console.warn("Could not load user custom cards:", err);
                }
            }

            if (isMounted) setLoadingData(false);
        }

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, user]);

    const currentRat = characters[selectedIndex] || characters[0];

    // Navigation cycle helpers
    const handlePrev = useCallback(() => {
        if (characters.length <= 1) return;
        playSound(SFX.select);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : characters.length - 1));
    }, [characters.length]);

    const handleNext = useCallback(() => {
        if (characters.length <= 1) return;
        playSound(SFX.select);
        setSelectedIndex((prev) => (prev < characters.length - 1 ? prev + 1 : 0));
    }, [characters.length]);

    // Launch journey
    const handleStartJourney = useCallback(async () => {
        if (!currentRat) return;
        playSound(SFX.confirm);

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            setErrorMessage(null);
            await startNewJourney(currentRat, {
                cheatsEnabled,
                includedCustomCardIds: selectedCardIds,
                multipliers: {
                    xpMultiplier,
                    damageMultiplier,
                    lootMultiplier,
                },
                statBonuses: {
                    hpBonus,
                    attackBonus,
                    defenseBonus,
                    critBonus,
                },
                enemySpawnRate,
            });
            navigate("/play");
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to initialize journey.");
        }
    }, [
        currentRat,
        isAuthenticated,
        navigate,
        startNewJourney,
        cheatsEnabled,
        selectedCardIds,
        xpMultiplier,
        damageMultiplier,
        lootMultiplier,
        hpBonus,
        attackBonus,
        defenseBonus,
        critBonus,
        enemySpawnRate,
    ]);

    // Keyboard controls (A/D/Arrows/Enter/Esc/C)
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
                handleStartJourney();
            } else if (e.key === "Escape") {
                e.preventDefault();
                navigate("/");
            } else if (e.key === "c" || e.key === "C") {
                e.preventDefault();
                setShowConfig((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handlePrev, handleNext, handleStartJourney, navigate]);

    // Render helper for visible 3-card slots (Prev, Active, Next)
    const visibleCards = useMemo(() => {
        if (characters.length === 0) return [];
        const prevIdx = (selectedIndex - 1 + characters.length) % characters.length;
        const nextIdx = (selectedIndex + 1) % characters.length;
        return [
            { character: characters[prevIdx], index: prevIdx, slot: "left" },
            { character: characters[selectedIndex], index: selectedIndex, slot: "center" },
            { character: characters[nextIdx], index: nextIdx, slot: "right" },
        ];
    }, [characters, selectedIndex]);

    return (
        <div
            className="min-h-screen bg-[#070c0a] text-[#b6c7b5] flex flex-col justify-between p-6 md:p-10 select-none overflow-x-hidden"
            style={{ fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'` }}
        >
            {/* Background Atmosphere Layer */}
            <div
                className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center"
                style={{
                    backgroundImage: `url("/assets/backgrounds/mainmenu_background.jpg")`,
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
                    <span>NEW JOURNEY</span>
                </div>
            </header>

            {/* Page Header Titles */}
            <section className="relative z-10 text-center my-4">
                <h1 className="text-3xl md:text-5xl font-black tracking-wider text-[#b9f046] uppercase drop-shadow-[0_2px_10px_rgba(185,240,70,0.3)]">
                    Choose Your Rat
                </h1>
                <p className="text-xs md:text-sm text-[#789077] mt-2 tracking-widest uppercase">
                    Every crown begins in the gutter. Who will you become?
                </p>
                {errorMessage && (
                    <div className="mt-3 inline-block px-4 py-2 bg-red-950/80 border border-red-600 text-red-200 text-xs">
                        {errorMessage}
                    </div>
                )}
            </section>

            {/* Main Interactive Carousel Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
                <div className="relative w-full flex items-center justify-center gap-4 md:gap-8 my-2">
                    {/* Left Carousel Arrow */}
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="z-20 p-3 md:p-4 bg-[#111917]/90 border border-[#2e4238] text-[#9cb19e] hover:bg-[#b9f046] hover:text-black hover:border-[#b9f046] transition-all"
                        aria-label="Previous Rat"
                    >
                        ◀
                    </button>

                    {/* 3 Cards Container */}
                    <div className="flex items-center justify-center gap-4 md:gap-6 w-full max-w-4xl">
                        {visibleCards.map(({ character, index, slot }) => {
                            const isCenter = slot === "center";
                            const lore = RAT_LORE[character.title] || {
                                tagline: character.is_preset ? "RAT WARRIOR" : "CUSTOM RAT MUTATION",
                                description: character.armor_piercing
                                    ? "Pierces armor mitigation with raw lethal force."
                                    : "Rugged denizen adapted to survival in the undercity.",
                                icon: character.armor_piercing ? "🗡️" : character.defense > 15 ? "🛡️" : "⚔️",
                            };

                            return (
                                <div
                                    key={`${character.id}-${index}-${slot}`}
                                    onClick={() => {
                                        if (!isCenter) {
                                            playSound(SFX.select);
                                            setSelectedIndex(index);
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
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-black/60 border border-[#22352d] flex items-center justify-center text-4xl md:text-5xl mb-4 relative overflow-hidden group">
                                            {character.sprite_url && (
                                                <img
                                                    src={character.sprite_url}
                                                    alt={character.title}
                                                    className="w-full h-full object-contain pixelated"
                                                    onError={(e) => {
                                                        // Fallback to emoji glyph if image fails
                                                        (e.target as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                            )}
                                            <span className="select-none">{lore.icon}</span>
                                        </div>

                                        <h2 className="text-xl md:text-2xl font-bold tracking-widest uppercase text-white">
                                            {character.title}
                                        </h2>
                                        <span className="text-[10px] text-[#718570] tracking-widest uppercase mt-0.5">
                                            {lore.tagline}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-center text-[11px] text-[#9cb19e] leading-relaxed my-2 px-2 border-y border-[#182620] py-2">
                                        "{lore.description}"
                                    </p>

                                    {/* Stat Bars */}
                                    <div className="space-y-2 text-[11px] font-mono">
                                        {/* HP */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#8ba28a]">HP</span>
                                            <span className="text-white font-bold">{character.hp}</span>
                                        </div>
                                        <div className="w-full bg-[#14201c] h-2 overflow-hidden border border-[#20332c]">
                                            <div
                                                className="bg-red-500 h-full"
                                                style={{ width: `${Math.min(100, (character.hp / 180) * 100)}%` }}
                                            />
                                        </div>

                                        {/* ATK */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#8ba28a]">ATTACK</span>
                                            <span className="text-white font-bold">{character.attack}</span>
                                        </div>
                                        <div className="w-full bg-[#14201c] h-2 overflow-hidden border border-[#20332c]">
                                            <div
                                                className="bg-[#b9f046] h-full"
                                                style={{ width: `${Math.min(100, (character.attack / 30) * 100)}%` }}
                                            />
                                        </div>

                                        {/* DEF */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#8ba28a]">DEFENSE</span>
                                            <span className="text-white font-bold">{character.defense}</span>
                                        </div>
                                        <div className="w-full bg-[#14201c] h-2 overflow-hidden border border-[#20332c]">
                                            <div
                                                className="bg-blue-400 h-full"
                                                style={{ width: `${Math.min(100, (character.defense / 25) * 100)}%` }}
                                            />
                                        </div>

                                        {/* Perks */}
                                        <div className="flex justify-between items-center pt-1 text-[10px]">
                                            <span className="text-[#657a66]">CRIT: {character.crit_chance}%</span>
                                            {character.armor_piercing ? (
                                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                                    ARMOR PIERCE
                                                </span>
                                            ) : (
                                                <span className="text-[#495b4a]">STANDARD</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Carousel Arrow */}
                    <button
                        type="button"
                        onClick={handleNext}
                        className="z-20 p-3 md:p-4 bg-[#111917]/90 border border-[#2e4238] text-[#9cb19e] hover:bg-[#b9f046] hover:text-black hover:border-[#b9f046] transition-all"
                        aria-label="Next Rat"
                    >
                        ▶
                    </button>
                </div>

                {/* Collapsible Journey Configuration (Custom Content, Multipliers, Stats, Cheats) */}
                <div className="w-full max-w-2xl mt-4">
                    <button
                        type="button"
                        onClick={() => setShowConfig((prev) => !prev)}
                        className="w-full py-2 px-4 bg-[#0d1613] border border-[#22352d] text-xs text-[#8ca872] hover:text-[#b9f046] hover:border-[#4d6b5e] flex items-center justify-between tracking-wider uppercase"
                    >
                        <span>⚙ JOURNEY OPTIONS, MULTIPLIERS & CHEATS</span>
                        <span>{showConfig ? "▲ HIDE" : "▼ CONFIGURE"}</span>
                    </button>

                    {showConfig && (
                        <div className="p-4 bg-[#0a110f] border-x border-b border-[#22352d] text-xs space-y-4 max-h-96 overflow-y-auto">
                            {/* Cheats Toggle */}
                            <div className="flex items-center justify-between py-2 border-b border-[#182620]">
                                <div>
                                    <div className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>Cheats & Dev Console</span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                            PRESS ` KEY IN-GAME
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-[#6d826c]">
                                        Enables console commands to spawn enemies, give items, and modify stats.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCheatsEnabled((prev) => !prev)}
                                    className={`px-3 py-1 font-bold text-xs uppercase border transition-colors ${
                                        cheatsEnabled
                                            ? "bg-[#b9f046] text-black border-[#b9f046]"
                                            : "bg-[#14201c] text-[#789077] border-[#293d33] hover:text-white"
                                    }`}
                                >
                                    {cheatsEnabled ? "ENABLED [Y]" : "DISABLED [N]"}
                                </button>
                            </div>

                            {/* Multipliers */}
                            <div className="py-2 border-b border-[#182620] space-y-2.5">
                                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                                    Gameplay Multipliers:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* XP Multiplier */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-[#8ca872] uppercase mb-1">XP Gain</div>
                                        <div className="flex gap-1">
                                            {[0.5, 1.0, 1.5, 2.0, 3.0].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setXpMultiplier(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        xpMultiplier === val
                                                            ? "bg-[#b9f046] text-black border-[#b9f046]"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    {val}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Damage Multiplier */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-[#8ca872] uppercase mb-1">Player Damage</div>
                                        <div className="flex gap-1">
                                            {[0.5, 1.0, 1.5, 2.0].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setDamageMultiplier(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        damageMultiplier === val
                                                            ? "bg-[#b9f046] text-black border-[#b9f046]"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    {val}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Loot Multiplier */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-[#8ca872] uppercase mb-1">Loot Drops</div>
                                        <div className="flex gap-1">
                                            {[0.5, 1.0, 2.0, 3.0].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setLootMultiplier(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        lootMultiplier === val
                                                            ? "bg-[#b9f046] text-black border-[#b9f046]"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    {val}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Individual Stat Tweaks */}
                            <div className="py-2 border-b border-[#182620] space-y-2.5">
                                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                                    Starting Stat Bonuses:
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {/* HP Bonus */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-red-400 uppercase mb-1">HP Bonus</div>
                                        <div className="flex flex-wrap gap-1">
                                            {[0, 25, 50, 100].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setHpBonus(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        hpBonus === val
                                                            ? "bg-red-500 text-white border-red-400"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Attack Bonus */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-[#b9f046] uppercase mb-1">ATK Bonus</div>
                                        <div className="flex flex-wrap gap-1">
                                            {[0, 5, 10, 20].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setAttackBonus(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        attackBonus === val
                                                            ? "bg-[#b9f046] text-black border-[#b9f046]"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Defense Bonus */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-blue-400 uppercase mb-1">DEF Bonus</div>
                                        <div className="flex flex-wrap gap-1">
                                            {[0, 5, 10, 20].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setDefenseBonus(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        defenseBonus === val
                                                            ? "bg-blue-500 text-white border-blue-400"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Crit Bonus */}
                                    <div className="bg-[#111917] p-2 border border-[#1e2e26]">
                                        <div className="text-[10px] text-yellow-400 uppercase mb-1">Crit Bonus</div>
                                        <div className="flex flex-wrap gap-1">
                                            {[0, 10, 25, 50].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setCritBonus(val)}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                                        critBonus === val
                                                            ? "bg-yellow-500 text-black border-yellow-400"
                                                            : "bg-[#15221d] text-[#6e856d] border-[#253930]"
                                                    }`}
                                                >
                                                    +{val}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enemy Spawn Density */}
                            <div className="py-2 border-b border-[#182620] space-y-2">
                                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                                    Enemy Spawn Density:
                                </div>
                                <div className="flex gap-2">
                                    {(["low", "normal", "swarm", "horde"] as EnemySpawnRate[]).map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => setEnemySpawnRate(rate)}
                                            className={`flex-1 py-1 px-2 text-[10px] font-bold uppercase border transition-colors ${
                                                enemySpawnRate === rate
                                                    ? "bg-[#b9f046] text-black border-[#b9f046]"
                                                    : "bg-[#14201c] text-[#789077] border-[#293d33] hover:text-white"
                                            }`}
                                        >
                                            {rate}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Content Checkboxes */}
                            <div className="py-1">
                                <div className="font-bold text-white uppercase tracking-wider mb-2 text-[11px]">
                                    Include Custom Cards in Pool:
                                </div>
                                {customCards.length === 0 ? (
                                    <div className="text-[11px] text-[#556954] italic">
                                        No custom cards created yet. Visit 'The Grand Mutator' to design cards!
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                                        {customCards.map((card) => {
                                            const isChecked = selectedCardIds.includes(card.id);
                                            return (
                                                <label
                                                    key={card.id}
                                                    className="flex items-center gap-2 cursor-pointer text-[#8ca872] hover:text-white"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            setSelectedCardIds((prev) =>
                                                                isChecked
                                                                    ? prev.filter((id) => id !== card.id)
                                                                    : [...prev, card.id]
                                                            );
                                                        }}
                                                        className="accent-[#b9f046]"
                                                    />
                                                    <span className="font-bold">{card.title}</span>
                                                    <span className="text-[10px] text-[#556954]">
                                                        ({card.effect_type}: +{card.value})
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Primary Launch Action Button (Matching Mockup Screen 2) */}
                <div className="mt-6 flex flex-col items-center">
                    <button
                        type="button"
                        disabled={isStartingRun || characters.length === 0}
                        onClick={handleStartJourney}
                        className={`
                            px-10 py-3.5 bg-[#b9f046] text-[#0d1406] font-black text-sm md:text-base tracking-widest uppercase
                            border-2 border-[#e0ff88] shadow-[0_0_20px_rgba(185,240,70,0.4)]
                            hover:bg-[#d2ff6b] hover:scale-105 active:scale-95 transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {isStartingRun ? "DESCENDING..." : "▶ Start Journey"}
                    </button>
                </div>
            </main>

            {/* Footer Hints (Matching Mockup Screen 2) */}
            <footer className="relative z-10 pt-4 border-t border-[#1b2b23] flex flex-col md:flex-row justify-between items-center text-[10px] text-[#6d826c] tracking-widest uppercase gap-2">
                <div className="flex items-center gap-4">
                    <span>[ A / D ] SELECT</span>
                    <span>[ ENTER ] CONFIRM</span>
                    <span>[ C ] JOURNEY OPTIONS</span>
                </div>
                <div>THE SEWER. THE CROWN.</div>
            </footer>
        </div>
    );
};

export default NewJourneyPage;
