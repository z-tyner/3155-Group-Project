import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import MainMenuPage from "./pages/MainMenuPage.js";
import LoginPage from "./pages/LoginPage.js";
import SignupPage from "./pages/SignupPage.js";
import NewJourneyPage from "./pages/NewJourneyPage.js";
import ContinueJourneyPage from "./pages/ContinueJourneyPage.js";
import GrandMutatorPage from "./pages/GrandMutatorPage.js";
import OptionsPage from "./pages/OptionsPage.js";
import LeaderboardPage from "./pages/LeaderboardPage.js";
import Forum from "./pages/Forum.js";
import PlayGamePage from "./pages/PlayGamePage.js";
import { useAuth } from "./context/AuthContext.js";

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="app-container min-h-screen bg-black text-white">
      <Routes>
        {/* Main Menu as landing page */}
        <Route
          path="/"
          element={
            <MainMenuPage
              onNavigate={(path) => navigate(path)}
              onLogout={() => {
                logout();
                navigate("/login");
              }}
            />
          }
        />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage onNavigate={(path) => navigate(path)} />} />
        <Route path="/signup" element={<SignupPage onNavigate={(path) => navigate(path)} />} />

        {/* Game Journeys */}
        <Route path="/new-journey" element={<NewJourneyPage />} />
        <Route path="/continue-journey" element={<ContinueJourneyPage />} />
        <Route path="/play" element={<PlayGamePage />} />

        {/* Custom Content & Options */}
        <Route path="/grand-mutator" element={<GrandMutatorPage />} />
        <Route path="/options" element={<OptionsPage />} />

        {/* Social Features */}
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forums" element={<Forum />} />
      </Routes>
    </div>
  );
};

export default App;
