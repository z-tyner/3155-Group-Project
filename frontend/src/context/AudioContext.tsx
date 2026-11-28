/**
 * @file AudioContext.tsx
 * @description React Context managing global audio state, providing music and SFX volume controls, mute toggling for the Options page, and trigger methods for switching background music tracks.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { audioController } from "../game/engine/AudioController.js";

interface AudioSettings {
    masterVolume: number; // 0 - 100
    musicVolume: number;  // 0 - 100
    sfxVolume: number;    // 0 - 100
    isMuted: boolean;
}

interface AudioContextType extends AudioSettings {
    setMasterVolume: (val: number) => void;
    setMusicVolume: (val: number) => void;
    setSfxVolume: (val: number) => void;
    toggleMute: () => void;
    playMusic: (src: string) => void;
    stopMusic: () => void;
    playSfx: (src: string) => void;
}

const STORAGE_KEY = "rat_game_audio_settings";

const DEFAULT_SETTINGS: AudioSettings = {
    masterVolume: 70,
    musicVolume: 60,
    sfxVolume: 80,
    isMuted: false,
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AudioSettings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {}
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        audioController.setVolumes(
            settings.masterVolume / 100,
            settings.musicVolume / 100,
            settings.sfxVolume / 100,
            settings.isMuted
        );
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {}
    }, [settings]);

    const setMasterVolume = useCallback((val: number) => {
        setSettings((prev) => ({ ...prev, masterVolume: Math.max(0, Math.min(100, val)) }));
    }, []);

    const setMusicVolume = useCallback((val: number) => {
        setSettings((prev) => ({ ...prev, musicVolume: Math.max(0, Math.min(100, val)) }));
    }, []);

    const setSfxVolume = useCallback((val: number) => {
        setSettings((prev) => ({ ...prev, sfxVolume: Math.max(0, Math.min(100, val)) }));
    }, []);

    const toggleMute = useCallback(() => {
        setSettings((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }, []);

    const playMusic = useCallback((src: string) => {
        audioController.playMusic(src);
    }, []);

    const stopMusic = useCallback(() => {
        audioController.stopMusic();
    }, []);

    const playSfx = useCallback((src: string) => {
        audioController.playSfx(src);
    }, []);

    return (
        <AudioContext.Provider
            value={{
                ...settings,
                setMasterVolume,
                setMusicVolume,
                setSfxVolume,
                toggleMute,
                playMusic,
                stopMusic,
                playSfx,
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};

export function useAudio(): AudioContextType {
    const ctx = useContext(AudioContext);
    if (!ctx) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return ctx;
}
