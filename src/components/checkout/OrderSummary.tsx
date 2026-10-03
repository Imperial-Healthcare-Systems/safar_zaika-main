"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Button, Price, VegDot } from "@/components/ui";
import { CartSummaryRows, DeliveringTo } from "@/components/cart/CartPanel";
import { useCartStore } from "@/stores";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export function OrderSummary({ method, onConfirm, loading, className }: { method: PaymentMethod; onConfirm: () => void; loading?: boolean; className?: string }) {
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const cod = method === "cod";

  return (
    <div className={cn("rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">Order summary</p>
          <Link href={`/restaurant/${restaurantId}`} className="mt-1 block truncate font-display text-xl font-semibold tracking-tight text-cocoa-900 hover:underline">
            {restaurantName}
          </Link>
        </div>
        {/* The kitchen sees the same split: paid online vs collect at the seat. */}
        <Badge tone={cod ? "copper" : "leaf"} className="shrink-0 gap-1.5 normal-case tracking-normal" title={cod ? "Cash on delivery, collected by the partner at your seat" : "Paid online before the kitchen starts"}>
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {cod ? "Pay at your seat" : "Pay online"}
        </Badge>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {items.map(({ dish, quantity }) => (
          <li key={dish.id} className="flex items-center gap-3 py-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
              <Image src={dish.image} alt="" fill sizes="48px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <VegDot type={dish.veg} className="size-3.5" />
              <p className="truncate text-sm font-semibold text-cocoa-900">
                {dish.name} <span className="font-medium text-muted">× {quantity}</span>
              </p>
            </div>
            <Price value={dish.price * quantity} size="sm" />
          </li>
        ))}
      </ul>

      <CartSummaryRows className="mt-4 border-t border-line pt-4" />
      {cod && <p className="mt-2 text-[12px] text-muted">Collected by the delivery partner at hand-over. Exact change or UPI to the partner works.</p>}
      <DeliveringTo compact className="mt-4" />

      {/* Mobile uses the fixed bottom bar instead. */}
      <Button size="xl" full onClick={onConfirm} loading={loading} rightIcon={<ArrowRight className="size-4" />} className="mt-5 hidden md:inline-flex">
        {cod ? "Place order · pay at seat" : "Confirm order"}
      </Button>
      <p className="mt-3 hidden text-center text-[12px] text-muted md:block">Demo checkout · no real payment is taken.</p>
    </div>
  );
}
