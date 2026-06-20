import { api } from "@/lib/api/client";
import type { AuthUser, TokenPair } from "@/types/domain";

export interface LoginResponse extends TokenPair {
  requiresTotp: boolean;
  user?: AuthUser;
  sessionId?: string;
  device?: { id: string; trustScore: number; trustLevel: string; isNew: boolean; signals: string[] };
  message?: string;
}

export const authApi = {
  login: async (email: string, password: string, totpCode?: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, password, totpCode });
    return data;
  },
  register: async (payload: { email: string; password: string; phone?: string; roleNames?: string[] }) => {
    const { data } = await api.post<AuthUser>("/auth/register", payload);
    return data;
  },
  requestPasswordReset: async (email: string) => {
    const { data } = await api.post("/auth/password-reset/request", { email });
    return data;
  },
  confirmTotp: async (code: string) => {
    const { data } = await api.post("/auth/totp/verify", { code });
    return data;
  },
  logout: async (refreshToken?: string) => {
    const { data } = await api.post("/auth/logout", { refreshToken });
    return data;
  }
};
