/**
 * @file LoginPage.tsx
 * @description User login authentication page styled to match the retro sewer/pixel art aesthetic.
 * Handles credential submission, error feedback, token persistence, and redirect upon success.
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

// Easily swappable visual assets
const LOGIN_ASSETS = {
    background: "/assets/backgrounds/main_menu_bg.png",
    logo: "/assets/ui/rat_king_logo.png",
};

interface LoginPageProps {
    onNavigate?: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password) {
            setError("Email and password are required.");
            return;
        }

        try {
            setSubmitting(true);
            await login({ email: email.trim(), password });

            // Navigate to main menu upon successful login
            if (onNavigate) {
                onNavigate("/");
            } else {
                window.location.href = "/";
            }
        } catch (err: any) {
            setError(err?.message || "Invalid email or password.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignupLink = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate("/signup");
        } else {
            window.location.href = "/signup";
        }
    };

    return (
        <div
            className="login-page relative w-full h-screen overflow-hidden select-none bg-black flex flex-col justify-between"
            style={{
                fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'`,
            }}
        >
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url("${LOGIN_ASSETS.background}")`,
                    backgroundColor: "#0d1314",
                }}
            />

            {/* Retro CRT / Dark Vignette Overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.75) 90%), linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%)",
                    backgroundSize: "100% 100%, 100% 4px",
                }}
            />

            {/* Top Bar */}
            <header className="relative z-10 px-10 pt-8 flex justify-between items-start">
                <div className="flex items-center gap-2 text-xs text-[#95a894] tracking-widest uppercase font-mono bg-black/40 px-3 py-1.5 border border-[#2b3a2a]">
                    <span className="inline-block w-2 h-2 bg-[#8ca872]" />
                    <span>Enter The Sewer</span>
                </div>
            </header>

            {/* Central Form Container */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md bg-[#111917]/90 border border-[#22352d] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
                    {/* Header Logo or Stylized Text */}
                    <div className="flex flex-col items-center mb-6">
                        {LOGIN_ASSETS.logo ? (
                            <img
                                src={LOGIN_ASSETS.logo}
                                alt="Rat King"
                                className="w-48 object-contain mb-2 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="text-3xl font-black text-[#e8f5e9] tracking-widest mb-1">
                                RAT <span className="text-[#b9f046]">KING</span>
                            </div>
                        )}
                        <h2 className="text-xs text-[#8ca872] uppercase tracking-widest font-mono">
                            Identify Yourself
                        </h2>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-950/80 border border-red-700 text-red-300 text-xs font-mono tracking-wide">
                            [!] {error}
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1.5">
                                Sewer Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="rat@burrow.com"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2.5 font-mono transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2.5 font-mono transition-colors"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`
                                mt-2 w-full font-bold tracking-widest uppercase transition-all duration-150 py-3 border text-xs
                                ${
                                    submitting
                                        ? "bg-[#22352d] text-[#6d8276] border-[#31483e] cursor-not-allowed"
                                        : "bg-[#b9f046] text-[#0d1406] border-[#e0ff88] hover:bg-[#c9fa5f] shadow-[0_0_15px_rgba(185,240,70,0.3)] active:translate-y-0.5"
                                }
                            `}
                        >
                            {submitting ? "VERIFYING..." : "ENTER THE BURROW ▶"}
                        </button>
                    </form>

                    {/* Navigation Link to Signup */}
                    <div className="mt-6 pt-4 border-t border-[#1a2622] text-center text-xs font-mono">
                        <span className="text-[#647a6b]">New to the underground? </span>
                        <a
                            href="/signup"
                            onClick={handleSignupLink}
                            className="text-[#b9f046] hover:underline font-bold tracking-wide"
                        >
                            Create a Rat
                        </a>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-10 px-10 pb-6 flex justify-between items-center text-[10px] text-[#556b5a] font-mono tracking-widest">
                <div>[ ESC ] RETURN TO SHADOWS</div>
                <div>ONE SEWER. ONE CROWN.</div>
            </footer>
        </div>
    );
};

export default LoginPage;
