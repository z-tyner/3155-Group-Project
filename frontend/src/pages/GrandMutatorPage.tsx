import React from "react";
import { Link } from "react-router-dom";

export const GrandMutatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">THE GRAND MUTATOR</h1>
      <p className="text-slate-400 mb-8">Speak with the Mutator to generate custom cards with AI.</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-lg">
        <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Describe your card idea:</label>
        <textarea
          rows={3}
          placeholder="Ex: A glowing rat fang that deals damage and steals defense"
          className="w-full bg-black border border-slate-700 p-3 text-xs mb-4 text-white focus:outline-none focus:border-ratGreen"
        />
        <button className="px-5 py-2.5 bg-ratGreen text-black font-bold uppercase hover:bg-lime-400 text-xs">
          MUTATE CARD ▶
        </button>
      </div>
    </div>
  );
};

export default GrandMutatorPage;
