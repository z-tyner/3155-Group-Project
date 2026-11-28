import React from "react";
import { Link } from "react-router-dom";
import { useAudio } from "../context/AudioContext.js";

export const OptionsPage: React.FC = () => {
  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    isMuted,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMute,
    playSfx,
  } = useAudio();

  return (
    <div className="min-h-screen bg-[#070c0a] text-white p-10 font-mono">
      <Link
        to="/"
        onClick={() => playSfx("/assets/audio/sfx/ui_back.wav")}
        className="text-[#b9f046] hover:underline mb-6 inline-block text-xs tracking-widest uppercase"
      >
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-black text-[#b9f046] mb-2 uppercase tracking-wider">
        OPTIONS & SETTINGS
      </h1>
      <p className="text-[#789077] text-xs uppercase tracking-widest mb-8">
        Tune your burrow experience.
      </p>

      <div className="p-6 bg-[#0c1613] border-2 border-[#22352d] max-w-lg space-y-5">
        <div>
          <div className="flex justify-between text-xs uppercase tracking-widest text-[#9cb19e] mb-1">
            <label>Master Volume</label>
            <span className="text-[#b9f046] font-bold">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-full accent-[#b9f046]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs uppercase tracking-widest text-[#9cb19e] mb-1">
            <label>Music Volume</label>
            <span className="text-[#b9f046] font-bold">{musicVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className="w-full accent-[#b9f046]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs uppercase tracking-widest text-[#9cb19e] mb-1">
            <label>SFX Volume</label>
            <span className="text-[#b9f046] font-bold">{sfxVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            className="w-full accent-[#b9f046]"
          />
        </div>

        <div className="pt-3 border-t border-[#1b2b23] flex items-center justify-between">
          <button
            type="button"
            onClick={toggleMute}
            className={`px-4 py-2 text-xs font-bold uppercase border transition-colors ${
              isMuted
                ? "bg-red-900/60 text-red-200 border-red-600"
                : "bg-[#14201c] text-[#b9f046] border-[#293d33] hover:border-[#b9f046]"
            }`}
          >
            {isMuted ? "🔇 AUDIO MUTED" : "🔊 AUDIO ENABLED"}
          </button>

          <button
            type="button"
            onClick={() => playSfx("/assets/audio/sfx/menu_confirm.wav")}
            className="px-4 py-2 bg-[#b9f046] text-black text-xs font-bold uppercase hover:bg-[#d2ff6b]"
          >
            TEST SFX
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsPage;
