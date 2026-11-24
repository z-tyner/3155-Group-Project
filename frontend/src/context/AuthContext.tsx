/**
 * @file AuthContext.tsx
 * @description React Context and Provider managing user authentication state, token persistence in localStorage, login, and logout.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../services/authApi.js";
import { getStoredToken } from "../services/api.js";
import type { User, SignupCredentials, LoginCredentials } from "../types/user.js";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(getStoredToken());
    const [loading, setLoading] = useState<boolean>(true);

    // Rehydrate user profile if token exists in localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getStoredToken();
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await authApi.getCurrentUser();
                setUser(currentUser);
                setToken(storedToken);
            } catch {
                // Invalid or expired token
                authApi.logout();
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const res = await authApi.login(credentials);
        setUser(res.user);
        setToken(res.token);
    };

    const signup = async (credentials: SignupCredentials) => {
        const res = await authApi.signup(credentials);
        setUser(res.user);
        setToken(res.token);
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user && !!token,
                loading,
                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
