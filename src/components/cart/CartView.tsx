"use client";

import { Clock3, Sparkles, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { OfferCard } from "@/components/offers/OfferCard";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";
import { CartPanel, DeliveringTo } from "./CartPanel";
import { offers } from "@/data/offers";
import { FREE_DELIVERY_ABOVE } from "@/services";
import { selectCartCount, selectCartTotals, useCartStore } from "@/stores";
import { useHydrated } from "@/hooks/useHydrated";

export function CartView() {
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const totals = useCartStore(selectCartTotals);
  const remaining = Math.max(0, FREE_DELIVERY_ABOVE - totals.itemTotal);
  const pct = Math.min(100, (totals.itemTotal / FREE_DELIVERY_ABOVE) * 100);

  return (
    <>
      <PageHeader
        compact
        title={
          hydrated && count > 0 ? (
            <>
              {count} item{count === 1 ? "" : "s"}. <span className="text-copper-600">One hot hand-over.</span>
            </>
          ) : (
            "Nothing in the cart yet."
          )
        }
        description="Everything ships together from one kitchen, timed to your halt."
      />
      <section className="container-x grid gap-8 pb-24 pt-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">{hydrated ? <CartPanel /> : null}</div>
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          {hydrated && count > 0 && (
            <div className="rounded-3xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold text-cocoa-900">
                  <Truck className="size-4 text-copper-600" /> Free delivery to seat
                </p>
                <span className="text-sm font-semibold text-muted">
                  {remaining > 0 ? (
                    <>
                      ₹<AnimatedNumber value={remaining} /> to go
                    </>
                  ) : (
                    <span className="text-leaf-600">Unlocked</span>
                  )}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
                <div className="h-full rounded-full bg-gradient-to-r from-copper-400 to-leaf-500 transition-[width] duration-700 ease-(--ease-out-expo)" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-[12px] text-muted">Orders above ₹{FREE_DELIVERY_ABOVE} deliver free. Otherwise ₹29 covers the platform hand-over.</p>
            </div>
          )}
          <DeliveringTo />
          <div className="rounded-3xl bg-cocoa-900 p-5 text-cream-50">
            <h2 className="font-display text-xl">Good to know</h2>
            <ul className="mt-3 space-y-3 text-sm text-cream-50/80">
              <li className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-gold-400" /> Kitchens need 45 minutes before your train&apos;s arrival. We&apos;ll warn you if a halt is too close.
              </li>
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-400" /> Prices shown are what you pay. Vendor costs stay between us and the kitchen.
              </li>
            </ul>
          </div>
          <div className="grid gap-4">
            {offers.slice(0, 2).map((o) => (
              <OfferCard key={o.code} offer={o} />
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
