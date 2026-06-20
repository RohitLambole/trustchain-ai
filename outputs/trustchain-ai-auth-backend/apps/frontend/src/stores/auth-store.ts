"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type { AuthUser, TokenPair } from "@/types/domain";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  requiresTotp: boolean;
  pendingEmail: string | null;
  setAuth: (user: AuthUser, tokens: TokenPair) => void;
  setTotpRequired: (email: string) => void;
  logout: () => void;
  refresh: () => Promise<string | null>;
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      requiresTotp: false,
      pendingEmail: null,
      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          requiresTotp: false,
          pendingEmail: null
        }),
      setTotpRequired: (email) => set({ requiresTotp: true, pendingEmail: email }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, requiresTotp: false, pendingEmail: null }),
      refresh: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) return null;
        try {
          const { data } = await axios.post<TokenPair>(`${baseURL}/auth/refresh`, { refreshToken });
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          return data.accessToken;
        } catch {
          get().logout();
          return null;
        }
      }
    }),
    { name: "trustchain-auth" }
  )
);
