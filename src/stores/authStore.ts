"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  /** true once the visitor chose "continue as guest" */
  guest: boolean;
  login: (user: User) => void;
  continueAsGuest: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guest: false,
      login: (user) => set({ user, guest: false }),
      continueAsGuest: () => set({ guest: true }),
      logout: () => set({ user: null, guest: false }),
    }),
    { name: "sz-auth", skipHydration: true },
  ),
);
