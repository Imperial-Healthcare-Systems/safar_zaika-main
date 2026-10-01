"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Dish, OrderTotals, Restaurant } from "@/types";
import { computeTotals } from "@/services";

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  stationCode: string | null;
  couponCode: string | null;
  /** set when an add() hit a different-restaurant conflict; a modal resolves it */
  pendingReplace: { dish: Dish; restaurant: Restaurant } | null;
  /** Returns "conflict" when the cart holds items from another restaurant. */
  add: (dish: Dish, restaurant: Restaurant) => "added" | "conflict";
  replaceWith: (dish: Dish, restaurant: Restaurant) => void;
  cancelReplace: () => void;
  increment: (dishId: string) => void;
  decrement: (dishId: string) => void;
  remove: (dishId: string) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      stationCode: null,
      couponCode: null,
      pendingReplace: null,
      add: (dish, restaurant) => {
        const { items, restaurantId } = get();
        if (restaurantId && restaurantId !== restaurant.id && items.length > 0) {
          set({ pendingReplace: { dish, restaurant } });
          return "conflict";
        }
        const existing = items.find((i) => i.dish.id === dish.id);
        set({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          stationCode: restaurant.stationCode,
          items: existing
            ? items.map((i) => (i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i))
            : [...items, { dish, quantity: 1 }],
        });
        return "added";
      },
      replaceWith: (dish, restaurant) =>
        set({
          items: [{ dish, quantity: 1 }],
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          stationCode: restaurant.stationCode,
          couponCode: null,
          pendingReplace: null,
        }),
      cancelReplace: () => set({ pendingReplace: null }),
      increment: (dishId) =>
        set((s) => ({ items: s.items.map((i) => (i.dish.id === dishId ? { ...i, quantity: i.quantity + 1 } : i)) })),
      decrement: (dishId) =>
        set((s) => {
          const items = s.items
            .map((i) => (i.dish.id === dishId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          return items.length ? { items } : { items, restaurantId: null, restaurantName: null, stationCode: null, couponCode: null };
        }),
      remove: (dishId) =>
        set((s) => {
          const items = s.items.filter((i) => i.dish.id !== dishId);
          return items.length ? { items } : { items, restaurantId: null, restaurantName: null, stationCode: null, couponCode: null };
        }),
      setCoupon: (code) => set({ couponCode: code }),
      clear: () => set({ items: [], restaurantId: null, restaurantName: null, stationCode: null, couponCode: null }),
    }),
    {
      name: "sz-cart",
      skipHydration: true,
      partialize: (s) => ({ items: s.items, restaurantId: s.restaurantId, restaurantName: s.restaurantName, stationCode: s.stationCode, couponCode: s.couponCode }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);

// Memoized: selectors must return a stable reference for unchanged inputs,
// otherwise useSyncExternalStore re-renders forever.
let totalsArgs: [CartItem[], string | null, string | null] | null = null;
let totalsCache: OrderTotals | null = null;
export const selectCartTotals = (s: CartState): OrderTotals => {
  if (totalsCache && totalsArgs && totalsArgs[0] === s.items && totalsArgs[1] === s.couponCode && totalsArgs[2] === s.stationCode) return totalsCache;
  totalsArgs = [s.items, s.couponCode, s.stationCode];
  totalsCache = computeTotals(s.items, s.couponCode, s.stationCode);
  return totalsCache;
};
export const selectQuantity = (dishId: string) => (s: CartState) => s.items.find((i) => i.dish.id === dishId)?.quantity ?? 0;
