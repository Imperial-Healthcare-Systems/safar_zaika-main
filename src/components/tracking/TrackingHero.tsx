"use client";

import { useRef } from "react";
import { Armchair, Clock, MapPin, TrainFront } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui";
import { orderStatusSteps } from "@/data/orders";
import { getStation } from "@/data/stations";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, formatClock, prefersReducedMotion } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

/** Where the order is, in two or three words, for the status pill. */
const STATE: Record<OrderStatus, string> = {
  confirmed: "Order received",
  accepted: "Sent to the kitchen",
  preparing: "Being prepared",
  ready: "Packed",
  "partner-assigned": "On the way to the station",
  "at-station": "On your platform",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Dark hero: current step as the headline, a status row (state pill + small facts), plus the four facts a traveller checks first. */
export function TrackingHero({ order, stepIndex }: { order: Order; stepIndex: number }) {
  const cancelled = order.status === "cancelled";
  const paid = order.payment.status === "paid";
  const step = cancelled
    ? { label: "Order cancelled", description: `Reason: ${order.cancelReason ?? "not given"}. ${paid ? "Your payment goes back to the source within 5-7 working days." : "Nothing is due."}` }
    : orderStatusSteps[stepIndex];
  const station = getStation(order.deliveryStationCode);
  const live = !cancelled && order.status !== "delivered";
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
          // Only a moving order is "live"; delivered and cancelled are said once, by the status pill below.
          live && (
            <Badge tone="glass" className="gap-2 px-3 py-1.5 text-[13px] normal-case tracking-normal lg:text-[13px]">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-300 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-leaf-300" />
              </span>
              Live
            </Badge>
          )
        }
      >
        <div data-swap className="mt-6 flex flex-wrap items-center gap-2.5">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-cocoa-900">
            <span aria-hidden className={cn("size-2 rounded-full", cancelled ? "bg-chili-500" : live ? "bg-copper-500" : "bg-leaf-500")} />
            {STATE[order.status]}
          </p>
          <span className="tag-dark" title="Delivery station">
            {order.deliveryStationCode}
          </span>
          <span className="tag-dark">
            Coach {order.passenger.coach} · Berth {order.passenger.berth}
          </span>
          <span className="tag-dark">Order {order.id}</span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="panel-dark p-4">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-cream-50/65">
                <f.icon className="size-3.5" aria-hidden />
                {f.label}
              </dt>
              <dd className="mt-1.5 truncate text-base font-bold max-sm:whitespace-normal sm:text-lg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>
    </div>
  );
}
