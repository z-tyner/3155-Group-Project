/**
 * @file GameContext.tsx
 * @description React Context managing active roguelike game run session, selected character, journey config, and drafted cards deck.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Run, RunWithCards, JourneyConfig } from "../types/game.js";
import { DEFAULT_JOURNEY_CONFIG } from "../types/game.js";
import type { Character } from "../types/character.js";
import * as runApi from "../services/runApi.js";
import * as characterApi from "../services/characterApi.js";

interface GameContextType {
    activeRun: Run | RunWithCards | null;
    selectedCharacter: Character | null;
    journeyConfig: JourneyConfig;
    isLoading: boolean;
    error: string | null;
    startNewJourney: (
        character: Character,
        config: Partial<JourneyConfig>
    ) => Promise<Run>;
    resumeJourney: (runId: number) => Promise<RunWithCards>;
    abandonJourney: (runId: number) => Promise<void>;
    updateProgress: (score: number, levelReached: number) => Promise<void>;
    completeActiveRun: (score: number, levelReached: number) => Promise<void>;
    clearActiveSession: () => void;
    setJourneyConfig: React.Dispatch<React.SetStateAction<JourneyConfig>>;
}

const STORAGE_KEY_ACTIVE_RUN_ID = "rat_game_active_run_id";
const STORAGE_KEY_JOURNEY_CONFIG = "rat_game_journey_config";

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeRun, setActiveRun] = useState<Run | RunWithCards | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [journeyConfig, setJourneyConfig] = useState<JourneyConfig>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_JOURNEY_CONFIG);
            if (saved) return { ...DEFAULT_JOURNEY_CONFIG, ...JSON.parse(saved) };
        } catch {}
        return DEFAULT_JOURNEY_CONFIG;
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Save config updates to localStorage
    const updateJourneyConfig = (newConfig: Partial<JourneyConfig>) => {
        setJourneyConfig((prev) => {
            const updated = { ...prev, ...newConfig };
            try {
                localStorage.setItem(STORAGE_KEY_JOURNEY_CONFIG, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    // Hydrate active run on initial mount if saved
    useEffect(() => {
        const savedRunId = localStorage.getItem(STORAGE_KEY_ACTIVE_RUN_ID);
        if (savedRunId) {
            const id = Number(savedRunId);
            if (!Number.isNaN(id) && id > 0) {
                runApi.getRunById(id)
                    .then(async (run) => {
                        if (run && !run.completed_at) {
                            setActiveRun(run);
                            if (run.character_id) {
                                try {
                                    const char = await characterApi.getCharacterById(run.character_id);
                                    setSelectedCharacter(char);
                                } catch {}
                            }
                        } else {
                            localStorage.removeItem(STORAGE_KEY_ACTIVE_RUN_ID);
                        }
                    })
                    .catch(() => {
                        localStorage.removeItem(STORAGE_KEY_ACTIVE_RUN_ID);
                    });
            }
        }
    }, []);

    // Start a new journey run
    const startNewJourney = async (
        character: Character,
        config: Partial<JourneyConfig>
    ): Promise<Run> => {
        setIsLoading(true);
        setError(null);
        try {
            const newRun = await runApi.createRun(character.id);
            setActiveRun(newRun);
            setSelectedCharacter(character);
            updateJourneyConfig({
                selectedCharacterId: character.id,
                ...config,
            });
            localStorage.setItem(STORAGE_KEY_ACTIVE_RUN_ID, String(newRun.id));
            return newRun;
        } catch (err: any) {
            const msg = err.message || "Failed to start new journey";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Resume an existing active journey run
    const resumeJourney = async (runId: number): Promise<RunWithCards> => {
        setIsLoading(true);
        setError(null);
        try {
            const run = await runApi.getRunById(runId);
            setActiveRun(run);
            if (run.character_id) {
                try {
                    const char = await characterApi.getCharacterById(run.character_id);
                    setSelectedCharacter(char);
                } catch {}
            }
            localStorage.setItem(STORAGE_KEY_ACTIVE_RUN_ID, String(run.id));
            return run;
        } catch (err: any) {
            const msg = err.message || "Failed to resume journey";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Abandon / delete an active journey run
    const abandonJourney = async (runId: number): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await runApi.deleteRun(runId);
            if (activeRun?.id === runId) {
                setActiveRun(null);
                setSelectedCharacter(null);
                localStorage.removeItem(STORAGE_KEY_ACTIVE_RUN_ID);
            }
        } catch (err: any) {
            const msg = err.message || "Failed to abandon journey";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Mid-run progress update (e.g., stage clear)
    const updateProgress = async (score: number, levelReached: number): Promise<void> => {
        if (!activeRun) return;
        try {
            const updated = await runApi.updateRunProgress(activeRun.id, {
                score,
                level_reached: levelReached,
            });
            setActiveRun((prev) => (prev ? { ...prev, score: updated.score, level_reached: updated.level_reached } : updated));
        } catch (err: any) {
            console.error("Failed to update run progress:", err);
        }
    };

    // Complete run
    const completeActiveRun = async (score: number, levelReached: number): Promise<void> => {
        if (!activeRun) return;
        try {
            await runApi.completeRun(activeRun.id, { score, level_reached: levelReached });
            setActiveRun(null);
            localStorage.removeItem(STORAGE_KEY_ACTIVE_RUN_ID);
        } catch (err: any) {
            console.error("Failed to complete run:", err);
        }
    };

    const clearActiveSession = () => {
        setActiveRun(null);
        setSelectedCharacter(null);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_RUN_ID);
    };

    return (
        <GameContext.Provider
            value={{
                activeRun,
                selectedCharacter,
                journeyConfig,
                isLoading,
                error,
                startNewJourney,
                resumeJourney,
                abandonJourney,
                updateProgress,
                completeActiveRun,
                clearActiveSession,
                setJourneyConfig,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
};
