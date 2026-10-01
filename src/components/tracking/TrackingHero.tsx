"use client";

import { useRef } from "react";
import { Armchair, Clock, MapPin, TrainFront } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui";
import { orderStatusSteps } from "@/data/orders";
import { getStation } from "@/data/stations";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatClock, prefersReducedMotion } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

/** Coach-indicator wording for the LED strip. */
const LED: Record<OrderStatus, string> = {
  confirmed: "RECEIVED",
  accepted: "SENT TO KITCHEN",
  preparing: "PREPARING",
  ready: "PACKED",
  "partner-assigned": "EN ROUTE",
  "at-station": "ON PLATFORM",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

/** Dark hero: current step as the headline, an LED status strip, plus the four facts a traveller checks first. */
export function TrackingHero({ order, stepIndex }: { order: Order; stepIndex: number }) {
  const cancelled = order.status === "cancelled";
  const paid = order.payment.status === "paid";
  const step = cancelled
    ? { label: "Order cancelled", description: `Reason: ${order.cancelReason ?? "not given"}. ${paid ? "Your payment goes back to the source within 5-7 working days." : "Nothing is due."}` }
    : orderStatusSteps[stepIndex];
  const station = getStation(order.deliveryStationCode);
  const live = !cancelled && order.status !== "delivered";
  const ledText = [LED[order.status], live ? "ON TIME" : null, `${order.passenger.coach}/${order.passenger.berth}`].filter(Boolean).join(" · ");
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo("[data-swap]", { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: "expo.out" });
    },
    { scope: ref, dependencies: [stepIndex, cancelled] },
  );

  const facts = [
    { icon: Clock, label: live ? "Arrives" : cancelled ? "Was due" : "Delivered", value: formatClock(order.deliveryEta) },
    { icon: TrainFront, label: "Train", value: `${order.trainNumber} · ${order.trainName}` },
    { icon: MapPin, label: "Delivery station", value: station ? `${station.name} (${station.code})` : order.deliveryStationCode },
    { icon: Armchair, label: "Coach / berth", value: `${order.passenger.coach} / ${order.passenger.berth}` },
  ];

  return (
    <div ref={ref}>
      <PageHeader
        dark
        compact
        title={
          <span data-swap className="block">
            {step.label}
          </span>
        }
        description={
          <span data-swap className="block">
            {step.description}
          </span>
        }
        actions={
          <Badge tone={cancelled ? "chili" : live ? "glass" : "leaf"}>
            {live && (
              <span className="relative mr-0.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-300 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-leaf-300" />
              </span>
            )}
            {cancelled ? "Cancelled" : live ? "Live" : "Delivered"}
          </Badge>
        }
      >
        <div data-swap className="mt-6 flex flex-wrap items-center gap-3">
          <p className="led-panel inline-flex max-w-full rounded-lg px-4 py-2.5" aria-label={`Status board: ${ledText}`}>
            <span className="led truncate text-base sm:text-lg">{ledText}</span>
          </p>
          <span className="signboard" title="Delivery station">
            {order.deliveryStationCode}
          </span>
          <span className="rounded-full glass px-3 py-1.5 text-[13px] font-semibold">Order {order.id}</span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="glass rounded-2xl p-4">
              <dt className="flex items-center gap-1.5 text-[12px] font-semibold text-cream-50/60">
                <f.icon className="size-3.5 text-gold-400" />
                {f.label}
              </dt>
              <dd className="mt-1.5 truncate font-display text-lg font-semibold sm:text-xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>
    </div>
  );
}
