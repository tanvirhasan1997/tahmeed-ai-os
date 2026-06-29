import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState { user: any; tokens: any; setAuth: (user: any, tokens: any) => void; logout: () => void; }
export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null, tokens: null,
  setAuth: (user, tokens) => set({ user, tokens }),
  logout: () => { set({ user: null, tokens: null }); if (typeof window !== "undefined") window.location.href = "/login"; },
}), { name: "auth-storage" }));

interface CommandState { messages: any[]; isLoading: boolean; addMessage: (m: any) => void; setLoading: (l: boolean) => void; clearMessages: () => void; }
export const useCommandStore = create<CommandState>((set) => ({
  messages: [], isLoading: false,
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setLoading: (l) => set({ isLoading: l }),
  clearMessages: () => set({ messages: [] }),
}));
