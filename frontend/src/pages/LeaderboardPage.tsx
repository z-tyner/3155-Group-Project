import React from "react";
import { Link } from "react-router-dom";

export const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">SEWER LEADERBOARD</h1>
      <p className="text-slate-400 mb-8">Top runs ranked by highest level cleared and accumulated XP.</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-2xl">
        <div className="grid grid-cols-4 text-xs uppercase text-slate-400 border-b border-slate-700 pb-2 mb-2">
          <span>Rank</span>
          <span>Rat</span>
          <span>Level</span>
          <span>XP</span>
        </div>
        <div className="text-sm text-slate-500 py-4 text-center">
          No runs recorded yet. Start a journey to claim your spot!
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
