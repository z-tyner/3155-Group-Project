/**
 * @file api.ts
 * @description Centralized Fetch HTTP client configured with base URL and authorization interceptors to inject JWT bearer tokens.
 */

const API_BASE = "/api";
const TOKEN_KEY = "rat_game_token";

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...rest } = options;

    let url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined) searchParams.append(key, String(val));
        });
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
    }

    const token = getStoredToken();
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        headers: {
            ...defaultHeaders,
            ...(headers as Record<string, string>),
        },
        ...rest,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg) as Error & { status?: number; data?: any };
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data as T;
}
