import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { api, apiBaseURL } from "@/api/client";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  hasBootstrapped: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const baseOrigin = new URL(apiBaseURL).origin;

const ensureCsrf = () => axios.get(`${baseOrigin}/sanctum/csrf-cookie`, { withCredentials: true });

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      hasBootstrapped: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          await ensureCsrf();
          const { data } = await api.post<{ user: User }>("/auth/login", { email, password });
          set({ user: data.user, isLoading: false, hasBootstrapped: true });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      register: async (input) => {
        set({ isLoading: true });
        try {
          await ensureCsrf();
          const { data } = await api.post<{ user: User }>("/auth/register", input);
          set({ user: data.user, isLoading: false, hasBootstrapped: true });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // best-effort
        }
        set({ user: null });
      },
      fetchMe: async () => {
        try {
          const { data } = await api.get<User>("/auth/me");
          set({ user: data, hasBootstrapped: true });
        } catch {
          set({ user: null, hasBootstrapped: true });
        }
      },
    }),
    { name: "vaultdocs-auth", partialize: (s) => ({ user: s.user }) }
  )
);
