/**
 * @file AudioController.ts
 * @description Audio controller managing Web Audio / HTML5 Audio playback for .wav music tracks (main menu theme, per-level exploration themes, monster battle themes, boss battle themes) and sound effects, including volume attenuation, track looping, and cross-fading.
 */

export class AudioController {
    private currentMusic: HTMLAudioElement | null = null;
    private currentMusicSrc: string | null = null;
    private masterVolume: number = 0.7;
    private musicVolume: number = 0.6;
    private sfxVolume: number = 0.8;
    private muted: boolean = false;

    public setVolumes(
        masterVolume: number,
        musicVolume: number,
        sfxVolume: number,
        muted: boolean
    ): void {
        this.masterVolume = Math.max(0, Math.min(1, masterVolume));
        this.musicVolume = Math.max(0, Math.min(1, musicVolume));
        this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
        this.muted = muted;

        if (this.currentMusic) {
            this.currentMusic.volume = this.getEffectiveMusicVolume();
        }
    }

    private getEffectiveMusicVolume(): number {
        if (this.muted) return 0;
        return Math.max(0, Math.min(1, this.masterVolume * this.musicVolume));
    }

    private getEffectiveSfxVolume(): number {
        if (this.muted) return 0;
        return Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume));
    }

    public playMusic(src: string): void {
        if (!src) return;
        if (this.currentMusicSrc === src && this.currentMusic) {
            this.currentMusic.volume = this.getEffectiveMusicVolume();
            if (this.currentMusic.paused) {
                this.currentMusic.play().catch(() => {});
            }
            return;
        }

        this.stopMusic();

        try {
            const audio = new Audio(src);
            audio.loop = true;
            audio.volume = this.getEffectiveMusicVolume();
            this.currentMusic = audio;
            this.currentMusicSrc = src;
            audio.play().catch(() => {});
        } catch {
            // Ignore autoplay or missing asset errors
        }
    }

    public stopMusic(): void {
        if (this.currentMusic) {
            try {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
            } catch {}
        }
        this.currentMusic = null;
        this.currentMusicSrc = null;
    }

    public playSfx(src: string): void {
        if (!src || this.muted) return;
        const vol = this.getEffectiveSfxVolume();
        if (vol <= 0) return;

        try {
            const audio = new Audio(src);
            audio.volume = vol;
            audio.play().catch(() => {});
        } catch {
            // Ignore missing/empty placeholder audio errors
        }
    }
}

export const audioController = new AudioController();
