"use client";

import { type ReactNode } from "react";
import { Armchair, Headset, MapPin, Phone, RotateCcw, TrainFront, UserRound } from "lucide-react";
import { Badge, Button, Price, VegDot } from "@/components/ui";
import { paymentLabel } from "@/components/checkout/PaymentMethods";
import { getStation } from "@/data/stations";
import { cn, formatClock, formatDate, formatINR } from "@/lib/utils";
import { toast } from "@/stores";
import type { Order } from "@/types";

const card = "rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6";

function Row({ label, value, className }: { label: ReactNode; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-3", className)}>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function OrderDetails({ order, className }: { order: Order; className?: string }) {
  const t = order.totals;
  const paid = order.payment.status === "paid";
  const cancelled = order.status === "cancelled";
  const paymentNote = cancelled
    ? paid
      ? `Cancelled · ${formatINR(t.total)} refunded to the source within 5-7 working days`
      : "Cancelled · nothing to pay"
    : paid
      ? `Prepaid via ${paymentLabel[order.payment.method]}`
      : "Cash on delivery: the partner collects it at your seat on Safar Zaika's behalf";
  return (
    <section className={cn(card, className)} aria-labelledby="details-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">Your order</p>
          <h2 id="details-title" className="mt-1 truncate font-display text-xl font-semibold tracking-tight text-cocoa-900">
            {order.restaurantName}
          </h2>
        </div>
        {/* Same split the kitchen sees on its slip. */}
        <Badge
          tone={cancelled ? "chili" : paid ? "leaf" : "copper"}
          className="shrink-0 gap-1.5 normal-case tracking-normal"
          title={cancelled ? "This order was cancelled" : paid ? "Paid online" : "Cash on delivery, collected at your seat"}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {cancelled ? "Cancelled" : paid ? "Paid online" : "Pay at your seat"}
        </Badge>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {order.items.map(({ dish, quantity }) => (
          <li key={dish.id} className="flex items-center gap-3 py-2.5">
            <VegDot type={dish.veg} className="size-3.5" />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-cocoa-900">
              {dish.name} <span className="font-medium text-muted">× {quantity}</span>
            </p>
            <Price value={dish.price * quantity} size="sm" />
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <Row label="Item total" value={formatINR(t.itemTotal)} />
        {t.discount > 0 && (
          <Row
            className="text-leaf-600 [&_dt]:text-leaf-600"
            label={
              <>
                Discount {t.couponCode && <span className="rounded-md bg-leaf-100 px-1.5 py-0.5 text-[11px] font-bold max-sm:text-xs">{t.couponCode}</span>}
              </>
            }
            value={`−${formatINR(t.discount)}`}
          />
        )}
        <Row label="Delivery to seat" value={t.deliveryFee === 0 ? "Free" : formatINR(t.deliveryFee)} className={cn(t.deliveryFee === 0 && "[&_dd]:text-leaf-600")} />
        <Row label="Taxes & charges" value={formatINR(t.taxes)} />
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-display text-xl font-bold tabular-nums">{formatINR(t.total)}</dd>
        </div>
      </dl>

      {!paid && !cancelled && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-copper-200 bg-copper-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-cocoa-900">Pay at delivery</p>
            <p className="text-[12px] text-muted">Cash or UPI to the partner at hand-over</p>
          </div>
          <p className="font-display text-2xl font-bold tabular-nums text-cocoa-900">{formatINR(t.total)}</p>
        </div>
      )}

      <p className="mt-4 text-[13px] text-muted">
        {paymentNote} · Placed {formatDate(order.placedAt)}
      </p>
    </section>
  );
}

export function DeliveryDetails({ order, className }: { order: Order; className?: string }) {
  const station = getStation(order.deliveryStationCode);
  const p = order.passenger;
  const rows = [
    { icon: UserRound, label: "Passenger", value: p.name },
    { icon: Phone, label: "Phone", value: `+91 ${p.phone}` },
    { icon: Armchair, label: "Coach / berth", value: `${p.coach} / ${p.berth}` },
    { icon: MapPin, label: "Station", value: station ? `${station.name} (${station.code})` : order.deliveryStationCode, sub: `Train arrives ${formatClock(order.deliveryEta)}` },
    { icon: TrainFront, label: "Train", value: `${order.trainNumber} ${order.trainName}` },
  ];
  return (
    <section className={cn(card, className)} aria-labelledby="delivery-title">
      <h2 id="delivery-title" className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
        Handing over at your seat
      </h2>
      <dl className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-cocoa-700">
              <r.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <dt className="text-[12px] font-semibold text-muted">{r.label}</dt>
              <dd className="truncate text-sm font-semibold text-cocoa-900">{r.value}</dd>
              {r.sub && <dd className="text-[12px] text-muted">{r.sub}</dd>}
            </div>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" leftIcon={<Headset className="size-4" />} onClick={() => toast({ title: "Support chat coming soon", description: "For now, call the number in your confirmation SMS." })}>
          Need help?
        </Button>
        <Button variant="secondary" href={`/restaurant/${order.restaurantId}`} leftIcon={<RotateCcw className="size-4" />}>
          Order again
        </Button>
      </div>
    </section>
  );
}
