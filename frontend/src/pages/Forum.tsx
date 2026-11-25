import React from "react";
import { Link } from "react-router-dom";

export const Forum: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">SEWER FORUMS</h1>
      <p className="text-slate-400 mb-8">Discuss strategies, trade tips, and read burrow announcements.</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-2xl space-y-4">
        <div className="p-4 bg-slate-800 border border-slate-700">
          <div className="text-xs uppercase text-ratGreen font-bold mb-1">📌 PINNED GUIDE</div>
          <h2 className="text-lg font-bold text-white mb-1">Survival Guide for New Burrow Explorers</h2>
          <p className="text-xs text-slate-400">Essential turn-based combat tips, armor-piercing mechanics, and stat allocations.</p>
        </div>
        <div className="text-sm text-slate-500 py-4 text-center">
          No other posts found. Start the discussion!
        </div>
      </div>
    </div>
  );
};

export default Forum;
