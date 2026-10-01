"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types";
import { getDemoOrder } from "@/services";

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrder: (id: string) => Order | undefined;
  updateStatus: (id: string, status: OrderStatus) => void;
  cancelOrder: (id: string, reason: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders.filter((o) => o.id !== order.id)] })),
      getOrder: (id) => {
        const demo = getDemoOrder();
        if (id.toUpperCase() === demo.id) return demo;
        return get().orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
      },
      updateStatus: (id, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
      cancelOrder: (id, reason) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled", cancelReason: reason } : o)) })),
    }),
    { name: "sz-orders", skipHydration: true },
  ),
);
