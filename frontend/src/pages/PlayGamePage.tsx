import React from "react";
import { Link } from "react-router-dom";

export const PlayGamePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-ratGreen mb-4">INTO THE SEWERS</h1>
      <p className="text-slate-400 mb-6">Battle arena active. Turn-based combat loop ready.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-slate-800 border border-slate-600 text-white hover:border-ratGreen uppercase font-bold"
      >
        ← RETREAT TO MAIN MENU
      </Link>
    </div>
  );
};

export default PlayGamePage;
