import React from "react";
import { Link } from "react-router-dom";

export const ContinueJourneyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">CONTINUE YOUR ADVENTURE</h1>
      <p className="text-slate-400 mb-8">Many rats make their journey for the crown. Which is yours?</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-lg">
        <p className="text-sm text-slate-400">[ No active save burrow found yet. Clear a level to save your progress! ]</p>
      </div>
    </div>
  );
};

export default ContinueJourneyPage;
