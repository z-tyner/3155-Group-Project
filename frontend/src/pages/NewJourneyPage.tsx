import React from "react";
import { Link } from "react-router-dom";

export const NewJourneyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-10 font-mono">
      <Link to="/" className="text-ratGreen hover:underline mb-6 inline-block">
        ← BACK TO MAIN MENU
      </Link>
      <h1 className="text-3xl font-bold text-ratGreen mb-2">CHOOSE YOUR RAT</h1>
      <p className="text-slate-400 mb-8">Every crown begins in the gutter. Who will you become?</p>
      <div className="p-6 bg-slate-900 border border-slate-700 max-w-lg">
        <p className="text-sm text-slate-300 mb-4">[ Placeholder: Character selector & journey configuration ]</p>
        <Link
          to="/play"
          className="inline-block px-5 py-2.5 bg-ratGreen text-black font-bold uppercase hover:bg-lime-400"
        >
          START JOURNEY ▶
        </Link>
      </div>
    </div>
  );
};

export default NewJourneyPage;
