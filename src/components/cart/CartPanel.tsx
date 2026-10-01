"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { Button, Price, VegDot } from "@/components/ui";
import { QuantityControl } from "@/components/menu/QuantityControl";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";
import { selectCartTotals, selectSelectedStation, useCartStore, useJourneyStore } from "@/stores";
import { getStation } from "@/data/stations";
import { cn, formatClock } from "@/lib/utils";

export function CartSummaryRows({ className }: { className?: string }) {
  const totals = useCartStore(selectCartTotals);
  const fmt = (n: number) => `₹${Math.round(n)}`;
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between">
        <dt className="text-muted">Item total</dt>
        <dd className="font-medium tabular-nums">
          <AnimatedNumber value={totals.itemTotal} format={fmt} />
        </dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-leaf-600">
          <dt>Discount {totals.couponCode && <span className="rounded-md bg-leaf-100 px-1.5 py-0.5 text-[11px] font-bold">{totals.couponCode}</span>}</dt>
          <dd className="font-medium tabular-nums">−{fmt(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Delivery to seat</dt>
        <dd className={cn("font-medium tabular-nums", totals.deliveryFee === 0 && "text-leaf-600")}>{totals.deliveryFee === 0 ? "Free" : fmt(totals.deliveryFee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Taxes &amp; charges</dt>
        <dd className="font-medium tabular-nums">{fmt(totals.taxes)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base">
        <dt className="font-bold">To pay</dt>
        <dd className="font-condensed text-2xl font-bold tabular-nums">
          <AnimatedNumber value={totals.total} format={fmt} />
        </dd>
      </div>
    </dl>
  );
}

export function DeliveringTo({ className, compact }: { className?: string; compact?: boolean }) {
  const journey = useJourneyStore((s) => s.journey);
  const selected = useJourneyStore(selectSelectedStation);
  const cartStation = useCartStore((s) => s.stationCode);
  const station = selected?.station ?? (cartStation ? getStation(cartStation) : undefined);
  const passenger = journey?.passengers[0];
  if (!station) return null;
  return (
    <div className={cn("rounded-2xl border border-line bg-cream-100 p-4", className)}>
      <p className="text-sm font-semibold text-muted">Delivering to</p>
      <div className="mt-2 flex items-start gap-3">
        <span className="signboard mt-1 shrink-0 text-[10px]">{station.code}</span>
        <div className="min-w-0">
          <p className="font-condensed text-xl font-bold text-cocoa-900">{station.name}</p>
          {journey && (
            <p className="text-[13px] text-muted">
              {journey.trainNumber} {journey.trainName}
              {selected?.stop.arrival && ` · arrives ${formatClock(selected.stop.arrival)}`}
            </p>
          )}
          {!compact && passenger && (
            <p className="mt-1 text-[13px] text-muted">
              Coach <span className="font-semibold text-cocoa-800">{passenger.coach}</span> · Berth <span className="font-semibold text-cocoa-800">{passenger.berth}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CartPanel({ onNavigate, inDrawer }: { onNavigate?: () => void; inDrawer?: boolean }) {
  const { items, restaurantName, restaurantId, increment, decrement, remove, clear } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-cream-200 text-copper-600">
          <ShoppingBag className="size-7" />
        </span>
        <h3 className="mt-5 font-display text-2xl">Your cart is empty</h3>
        <p className="mt-2 max-w-xs text-sm text-muted">Pick a station on your route and we&apos;ll show you what&apos;s cooking nearby.</p>
        <Button href="/order" className="mt-6" onClick={onNavigate} rightIcon={<ArrowRight className="size-4" />}>
          Start an order
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col", inDrawer ? "px-5 pb-5" : "")}>
      <div className="flex items-center justify-between pb-3">
        <div>
          <p className="text-[13px] font-semibold text-muted">From</p>
          <Link href={`/restaurant/${restaurantId}`} onClick={onNavigate} className="font-semibold text-cocoa-900 hover:underline">
            {restaurantName}
          </Link>
        </div>
        <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-chili-600">
          <Trash2 className="size-3.5" /> Clear
        </button>
      </div>

      <ul className="divide-y divide-line">
        {items.map(({ dish, quantity }) => (
          <li key={dish.id} className="flex items-center gap-3 py-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-200">
              <Image src={dish.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <VegDot type={dish.veg} className="size-3.5" />
                <p className="truncate text-sm font-semibold text-cocoa-900">{dish.name}</p>
              </div>
              <Price value={dish.price * quantity} size="sm" className="mt-1" />
              <button type="button" onClick={() => remove(dish.id)} className="mt-0.5 text-[12px] font-medium text-muted hover:text-chili-600">
                Remove
              </button>
            </div>
            <QuantityControl size="sm" value={quantity} onIncrement={() => increment(dish.id)} onDecrement={() => decrement(dish.id)} label={dish.name} />
          </li>
        ))}
      </ul>

      <DeliveringTo className="mt-4" compact />

      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <CartSummaryRows />
      </div>

      <div className={cn("mt-4", inDrawer && "sticky bottom-0 bg-cream-50 pt-2")}>
        <Button href="/checkout" full size="lg" onClick={onNavigate} rightIcon={<ArrowRight className="size-4" />} className="uppercase tracking-[0.08em]">
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
}
