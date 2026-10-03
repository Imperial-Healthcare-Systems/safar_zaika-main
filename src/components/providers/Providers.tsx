"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SmoothScroll } from "./SmoothScroll";
import { Toaster } from "@/components/ui/Toaster";
import { LoginModal } from "@/components/modals/LoginModal";
import { OrderNowModal } from "@/components/modals/OrderNowModal";
import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { SearchModal } from "@/components/modals/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ReplaceCartModal } from "@/components/cart/ReplaceCartModal";
import { useAuthStore, useCartStore, useJourneyStore, useOrderStore, useUIStore } from "@/stores";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Persisted stores skip hydration on the server; rehydrate once on the client
  // so server and first client render always match.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useJourneyStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useOrderStore.persist.rehydrate();
  }, []);

  // A new route never starts under an open drawer or modal.
  useEffect(() => {
    useUIStore.getState().closeAll();
  }, [pathname]);

  return (
    <>
      <SmoothScroll />
      {children}
      <Toaster />
      <LoginModal />
      <OrderNowModal />
      <WelcomeModal />
      <SearchModal />
      <CartDrawer />
      <ReplaceCartModal />
    </>
  );
}
