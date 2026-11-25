import React from "react";
import { Link } from "react-router-dom";

export const OptionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">OPTIONS & SETTINGS</h1>
      <p className="text-slate-400 mb-8">Tune your burrow experience.</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-lg space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Master Volume</label>
          <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Music Volume</label>
          <input type="range" min="0" max="100" defaultValue="60" className="w-full" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">SFX Volume</label>
          <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default OptionsPage;
