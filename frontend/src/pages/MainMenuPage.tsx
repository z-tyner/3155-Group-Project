/**
 * @file MainMenuPage.tsx
 * @description Main menu landing page matching the retro pixel-art aesthetic of the Game UI Mockup.
 * Features keyboard & mouse navigation, swappable background art, sound effects triggers, and route dispatching.
 */

import React, { useState, useEffect, useCallback } from "react";

// ============================================================================
// Easily Swappable Asset Paths
// Change these paths whenever you want to update the background or title graphics.
// ============================================================================
export const MAIN_MENU_ASSETS = {
    // Primary background PNG (extracted from the game mockup)
    background: "/assets/backgrounds/main_menu_bg.png",
    // Optional logo overlay (if not baked into the background)
    logo: "/assets/ui/rat_king_logo.png",
    // Audio track for the main menu
    menuTheme: "/assets/audio/music/menu/main_menu_theme.wav",
    // Menu click/nav sound effect
    selectSfx: "/assets/audio/sfx/menu_select.wav",
    confirmSfx: "/assets/audio/sfx/menu_confirm.wav",
};

export interface MenuItem {
    id: "new_journey" | "continue" | "custom_content" | "options" | "social" | "log_out";
    label: string;
    description?: string;
    path: string;
    disabled?: boolean;
}

interface MainMenuPageProps {
    hasSavedJourney?: boolean;
    savedBurrowName?: string;
    onNavigate?: (path: string) => void;
    onLogout?: () => void;
}

export const MainMenuPage: React.FC<MainMenuPageProps> = ({
    hasSavedJourney = false,
    savedBurrowName,
    onNavigate,
    onLogout,
}) => {
    // Menu options adhering to context.txt & Game UI Mockup
    const menuItems: MenuItem[] = [
        {
            id: "new_journey",
            label: "NEW JOURNEY",
            path: "/new-journey",
        },
        {
            id: "continue",
            label: "CONTINUE",
            path: "/continue-journey",
            disabled: !hasSavedJourney,
        },
        {
            id: "custom_content",
            label: "CUSTOM CONTENT",
            path: "/grand-mutator",
        },
        {
            id: "social",
            label: "SOCIAL & FORUMS",
            path: "/forum",
        },
        {
            id: "options",
            label: "OPTIONS",
            path: "/options",
        },
        {
            id: "log_out",
            label: "LOG OUT",
            path: "/login",
        },
    ];

    // Find the first enabled item as default
    const firstEnabledIndex = menuItems.findIndex((item) => !item.disabled);
    const [selectedIndex, setSelectedIndex] = useState<number>(
        firstEnabledIndex >= 0 ? firstEnabledIndex : 0
    );

    // Audio SFX helper (safe against missing audio elements)
    const playSound = (src: string) => {
        try {
            const audio = new Audio(src);
            audio.volume = 0.4;
            audio.play().catch(() => {
                // Ignore autoplay/missing asset restrictions in dev
            });
        } catch {
            // Audio not supported or failed to instantiate
        }
    };

    const handleSelect = (index: number) => {
        if (menuItems[index].disabled) return;
        setSelectedIndex(index);
        playSound(MAIN_MENU_ASSETS.selectSfx);
    };

    const handleConfirm = useCallback(
        (index: number) => {
            const item = menuItems[index];
            if (!item || item.disabled) return;

            playSound(MAIN_MENU_ASSETS.confirmSfx);

            if (item.id === "log_out") {
                if (onLogout) {
                    onLogout();
                } else if (onNavigate) {
                    onNavigate(item.path);
                } else {
                    window.location.href = item.path;
                }
                return;
            }

            if (onNavigate) {
                onNavigate(item.path);
            } else {
                window.location.href = item.path;
            }
        },
        [menuItems, onNavigate, onLogout]
    );

    // Keyboard controls (Up/Down arrow keys + Enter to confirm)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
                e.preventDefault();
                setSelectedIndex((prev) => {
                    let next = prev - 1;
                    while (next >= 0 && menuItems[next].disabled) {
                        next--;
                    }
                    if (next < 0) {
                        // Loop to bottom
                        next = menuItems.length - 1;
                        while (next >= 0 && menuItems[next].disabled) {
                            next--;
                        }
                    }
                    if (next >= 0 && !menuItems[next].disabled) {
                        playSound(MAIN_MENU_ASSETS.selectSfx);
                        return next;
                    }
                    return prev;
                });
            } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
                e.preventDefault();
                setSelectedIndex((prev) => {
                    let next = prev + 1;
                    while (next < menuItems.length && menuItems[next].disabled) {
                        next++;
                    }
                    if (next >= menuItems.length) {
                        // Loop to top
                        next = 0;
                        while (next < menuItems.length && menuItems[next].disabled) {
                            next++;
                        }
                    }
                    if (next < menuItems.length && !menuItems[next].disabled) {
                        playSound(MAIN_MENU_ASSETS.selectSfx);
                        return next;
                    }
                    return prev;
                });
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleConfirm(selectedIndex);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, menuItems, handleConfirm]);

    return (
        <div
            className="main-menu-container relative w-full h-screen overflow-hidden select-none bg-black flex flex-col justify-between"
            style={{
                fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'`,
            }}
        >
            {/* Background Graphic Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
                style={{
                    backgroundImage: `url("${MAIN_MENU_ASSETS.background}")`,
                    backgroundColor: "#0d1314",
                }}
            />

            {/* Subtle CRT / vignette overlay for atmosphere */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.6) 90%), linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
                    backgroundSize: "100% 100%, 100% 4px",
                }}
            />

            {/* Top Bar: Subtitle & Tagline */}
            <header className="relative z-10 px-10 pt-8 flex justify-between items-start">
                <div className="flex items-center gap-2 text-xs text-[#95a894] tracking-widest uppercase font-mono bg-black/40 px-3 py-1.5 border border-[#2b3a2a]">
                    <span className="inline-block w-2 h-2 bg-[#8ca872]" />
                    <span>Become the next Rat King... or die trying</span>
                </div>
            </header>

            {/* Main Interactive Row: Left Menu & Right Title Area */}
            <main className="relative z-10 px-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1">
                {/* Left Column: Command Menu */}
                <div className="md:col-span-5 lg:col-span-4 flex flex-col max-w-sm">
                    {/* Prompt Header */}
                    <div className="text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-4 pl-1">
                        MAKE YOUR NEXT MOVE
                    </div>

                    {/* Vertical Button Stack */}
                    <nav className="flex flex-col gap-2.5">
                        {menuItems.map((item, idx) => {
                            const isSelected = selectedIndex === idx;
                            const isDisabled = item.disabled;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={isDisabled}
                                    onMouseEnter={() => handleSelect(idx)}
                                    onClick={() => handleConfirm(idx)}
                                    className={`
                                        group relative w-full text-left font-bold tracking-wider uppercase transition-all duration-150
                                        px-5 py-3.5 border text-sm
                                        ${
                                            isDisabled
                                                ? "bg-[#111917]/70 text-[#3d504a] border-[#1d2b27] cursor-not-allowed"
                                                : isSelected
                                                ? "bg-[#b9f046] text-[#0d1406] border-[#e0ff88] shadow-[0_0_15px_rgba(185,240,70,0.4)] translate-x-1"
                                                : "bg-[#111917]/80 text-[#9cb19e] border-[#22352d] hover:border-[#4d6b5e] hover:text-[#d3e5d5] hover:bg-[#16231f]"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`text-xs ${
                                                isSelected
                                                    ? "opacity-100 text-[#0d1406]"
                                                    : "opacity-0 text-[#8ca872]"
                                            }`}
                                        >
                                            ▶
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Status Subtext */}
                    <div className="mt-5 pl-1 text-[11px] font-mono tracking-wide">
                        {hasSavedJourney ? (
                            <span className="text-[#8ab372]">
                                ACTIVE BURROW: {savedBurrowName || "RESUME SAVED RUN"}
                            </span>
                        ) : (
                            <span className="text-[#43574c]">NO SAVED BURROW FOUND.</span>
                        )}
                    </div>
                </div>

                {/* Right Column: Title Graphic / Logo */}
                <div className="hidden md:flex md:col-span-7 lg:col-span-8 justify-end items-center pr-6">
                    <div className="flex flex-col items-end">
                        {/* If logo asset is present, display pixel art logo */}
                        {MAIN_MENU_ASSETS.logo ? (
                            <img
                                src={MAIN_MENU_ASSETS.logo}
                                alt="Rat King"
                                className="w-80 lg:w-96 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                                onError={(e) => {
                                    // Fallback to text if PNG cannot be loaded
                                    (e.target as HTMLElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="text-right">
                                <div className="text-6xl font-black text-[#e8f5e9] tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                                    RAT
                                </div>
                                <div className="text-6xl font-black text-[#b9f046] tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                                    KING
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Footer: Keyboard Navigation Hints */}
            <footer className="relative z-10 px-10 pb-6 flex justify-between items-center text-[10px] text-[#556b5a] font-mono tracking-widest">
                <div className="flex items-center gap-6">
                    <span>↑ ↓ SELECT</span>
                    <span>[ ENTER ] CONFIRM</span>
                </div>
                <div>ONE SEWER. ONE CROWN.</div>
            </footer>
        </div>
    );
};

export default MainMenuPage;
