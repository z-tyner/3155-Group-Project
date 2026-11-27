/**
 * @file SignupPage.tsx
 * @description User registration page with client-side validation, retro styling, and auto-login transition upon creation.
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

// Easily swappable visual assets
const SIGNUP_ASSETS = {
    background: "/assets/backgrounds/mainmenu_background.png",
    logo: "/assets/ui/rat_king_logo.png",
};

interface SignupPageProps {
    onNavigate?: (path: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const { signup } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim()) {
            setError("A rat name (username) is required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email.trim())) {
            setError("Please provide a valid email address.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setSubmitting(true);
            await signup({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            // Navigate to main menu upon successful signup & auto-login
            if (onNavigate) {
                onNavigate("/");
            } else {
                window.location.href = "/";
            }
        } catch (err: any) {
            setError(err?.message || "Registration failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLoginLink = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate("/login");
        } else {
            window.location.href = "/login";
        }
    };

    return (
        <div
            className="signup-page relative w-full h-screen overflow-hidden select-none bg-black flex flex-col justify-between"
            style={{
                fontFamily: `'Courier New', Courier, monospace, 'Press Start 2P'`,
            }}
        >
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url("${SIGNUP_ASSETS.background}")`,
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
                    <span>New Burrow Citizen</span>
                </div>
            </header>

            {/* Central Form Container */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
                <div className="w-full max-w-md bg-[#111917]/90 border border-[#22352d] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
                    {/* Header Logo or Stylized Text */}
                    <div className="flex flex-col items-center mb-5">
                        {SIGNUP_ASSETS.logo ? (
                            <img
                                src={SIGNUP_ASSETS.logo}
                                alt="Rat King"
                                className="w-40 object-contain mb-2 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="text-2xl font-black text-[#e8f5e9] tracking-widest mb-1">
                                RAT <span className="text-[#b9f046]">KING</span>
                            </div>
                        )}
                        <h2 className="text-xs text-[#8ca872] uppercase tracking-widest font-mono">
                            Claim Your Rat Identity
                        </h2>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-300 text-xs font-mono tracking-wide">
                            [!] {error}
                        </div>
                    )}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1">
                                Rat Name (Username)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="WhiskerShadow"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2 font-mono transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1">
                                Sewer Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="rat@burrow.com"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2 font-mono transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1">
                                Password (min. 6 characters)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2 font-mono transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-[#718570] uppercase tracking-widest font-mono mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={submitting}
                                className="w-full bg-[#0d1413] border border-[#22352d] focus:border-[#b9f046] focus:outline-none text-white text-xs px-3.5 py-2 font-mono transition-colors"
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
                            {submitting ? "CLAIMING CROWN..." : "JOIN THE PACK ▶"}
                        </button>
                    </form>

                    {/* Navigation Link to Login */}
                    <div className="mt-5 pt-3.5 border-t border-[#1a2622] text-center text-xs font-mono">
                        <span className="text-[#647a6b]">Already part of the sewer? </span>
                        <a
                            href="/login"
                            onClick={handleLoginLink}
                            className="text-[#b9f046] hover:underline font-bold tracking-wide"
                        >
                            Log In
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

export default SignupPage;
