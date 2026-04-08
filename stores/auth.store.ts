import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { apiClient, storeTokens, clearTokens } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  rol: string;
  trabajadorId?: number;
  trabajadorNombre?: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

interface RefreshResponse {
  access: string;
  refresh?: string;
  user?: AuthUser;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// ─── Secure store keys ────────────────────────────────────────────────────────

const KEY_ACCESS = "tecozam_access_token";
const KEY_REFRESH = "tecozam_refresh_token";
const KEY_USER = "tecozam_user";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  // ── login ──────────────────────────────────────────────────────────────────
  login: async (username: string, password: string) => {
    set({ isLoading: true });

    try {
      const data = await apiClient.post<LoginResponse>("/api/auth/login", {
        username,
        password,
      });

      await storeTokens(data.access, data.refresh);
      await SecureStore.setItemAsync(KEY_USER, JSON.stringify(data.user));

      set({
        isAuthenticated: true,
        isLoading: false,
        user: data.user,
        accessToken: data.access,
        refreshToken: data.refresh,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    set({ isLoading: true });

    try {
      // Best-effort server-side revocation — ignore errors
      await apiClient.post("/api/auth/logout").catch(() => {});
    } finally {
      await clearTokens();
      await SecureStore.deleteItemAsync(KEY_USER).catch(() => {});

      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  },

  // ── restoreSession ─────────────────────────────────────────────────────────
  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const [storedAccess, storedRefresh, storedUser] = await Promise.all([
        SecureStore.getItemAsync(KEY_ACCESS),
        SecureStore.getItemAsync(KEY_REFRESH),
        SecureStore.getItemAsync(KEY_USER),
      ]);

      if (!storedRefresh) {
        // Nothing to restore
        set({ isLoading: false });
        return;
      }

      // Attempt to obtain a fresh access token using the stored refresh token
      const res = await fetch("https://bills-api.z-innova.com/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: storedRefresh }),
      });

      if (!res.ok) {
        // Refresh failed — session is dead
        await clearTokens();
        await SecureStore.deleteItemAsync(KEY_USER).catch(() => {});
        set({ isLoading: false });
        return;
      }

      const data = (await res.json()) as RefreshResponse;
      const newRefresh = data.refresh ?? storedRefresh;

      await storeTokens(data.access, newRefresh);

      // Resolve user: prefer response user, fall back to stored
      let user: AuthUser | null = data.user ?? null;
      if (!user && storedUser) {
        try {
          user = JSON.parse(storedUser) as AuthUser;
        } catch {
          user = null;
        }
      }

      if (user) {
        await SecureStore.setItemAsync(KEY_USER, JSON.stringify(user));
      }

      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken: data.access,
        refreshToken: newRefresh,
      });
    } catch {
      // Any unexpected error — treat as unauthenticated
      await clearTokens().catch(() => {});
      await SecureStore.deleteItemAsync(KEY_USER).catch(() => {});
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },
}));
