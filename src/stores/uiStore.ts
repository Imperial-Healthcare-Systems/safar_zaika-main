"use client";

import { create } from "zustand";

export type ToastTone = "default" | "success" | "error";
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}
export type ToastInput = string | { title: string; description?: string; tone?: ToastTone };

interface UIState {
  loginOpen: boolean;
  /** callback to run after a successful login (e.g. continue to checkout) */
  loginNext: (() => void) | null;
  orderNowOpen: boolean;
  cartOpen: boolean;
  searchOpen: boolean;
  mobileNavOpen: boolean;
  /** first-visit "Where's your train headed?" popup */
  welcomeOpen: boolean;
  toasts: Toast[];
  openLogin: (next?: () => void) => void;
  closeLogin: () => void;
  setOrderNowOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setWelcomeOpen: (open: boolean) => void;
  toast: (t: ToastInput) => void;
  dismissToast: (id: number) => void;
  /** close every overlay — called on route change */
  closeAll: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>()((set) => ({
  loginOpen: false,
  loginNext: null,
  orderNowOpen: false,
  cartOpen: false,
  searchOpen: false,
  mobileNavOpen: false,
  welcomeOpen: false,
  toasts: [],
  openLogin: (next) => set({ loginOpen: true, loginNext: next ?? null, mobileNavOpen: false, orderNowOpen: false, welcomeOpen: false }),
  closeLogin: () => set({ loginOpen: false, loginNext: null }),
  setOrderNowOpen: (open) => set({ orderNowOpen: open, mobileNavOpen: false, welcomeOpen: false }),
  setCartOpen: (open) => set({ cartOpen: open, mobileNavOpen: false, welcomeOpen: false }),
  setSearchOpen: (open) => set({ searchOpen: open, mobileNavOpen: false, welcomeOpen: false }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setWelcomeOpen: (open) => set({ welcomeOpen: open }),
  toast: (t) =>
    set((s) => {
      const next: Toast =
        typeof t === "string" ? { id: ++toastId, title: t, tone: "default" } : { id: ++toastId, title: t.title, description: t.description, tone: t.tone ?? "default" };
      return { toasts: [...s.toasts, next].slice(-4) };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  closeAll: () => set({ loginOpen: false, loginNext: null, orderNowOpen: false, cartOpen: false, searchOpen: false, mobileNavOpen: false, welcomeOpen: false }),
}));

export const toast = (t: ToastInput) => useUIStore.getState().toast(t);
