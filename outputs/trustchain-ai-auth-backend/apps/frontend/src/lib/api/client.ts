import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api",
  timeout: 15000
});

export const mlApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ML_API_BASE_URL ?? "http://localhost:8000",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const store = useAuthStore.getState();
    if (error.response?.status !== 401 || original?._retry || !store.refreshToken) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= store.refresh().finally(() => {
      refreshPromise = null;
    });
    const accessToken = await refreshPromise;
    if (!accessToken) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api(original);
  }
);
