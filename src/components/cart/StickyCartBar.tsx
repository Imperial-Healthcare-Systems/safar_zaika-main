"use client";

import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { selectCartCount, selectCartTotals, useCartStore, useUIStore } from "@/stores";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

/** Mobile-only bottom bar; keeps the cart one tap away while browsing. */
export function StickyCartBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const totals = useCartStore(selectCartTotals);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const hidden = !hydrated || count === 0 || pathname === "/cart" || pathname === "/checkout";

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-sticky transition-[transform,opacity] duration-500 ease-(--ease-out-expo) md:hidden",
        hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={hidden}
    >
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="flex h-14 w-full items-center justify-between rounded-2xl bg-cocoa-900 px-4 text-cream-50 shadow-lift"
      >
        <span className="flex items-center gap-3">
          <span className="relative inline-flex size-9 items-center justify-center rounded-xl bg-copper-500" data-cart-target>
            <ShoppingBag className="size-4" />
          </span>
          <span className="text-left">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-cream-50/60">
              {count} item{count === 1 ? "" : "s"}
            </span>
            <span className="block text-sm font-bold">
              <AnimatedNumber value={totals.total} format={(n) => `₹${Math.round(n)}`} />
            </span>
          </span>
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-gold-300">View cart →</span>
      </button>
    </div>
  );
}
