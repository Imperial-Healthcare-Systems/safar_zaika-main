"use client";

import { useRef } from "react";
import { Check, XCircle } from "lucide-react";
import { orderStatusSteps } from "@/data/orders";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import type { Order } from "@/types";

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const STEP_MS = 4 * 60_000;

/** Vertical timeline; the connector between steps fills up to the current one. stepIndex -1 = cancelled (nothing filled). */
export function OrderTimeline({ order, stepIndex, className }: { order: Order; stepIndex: number; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const placed = new Date(order.placedAt).getTime();
  const cancelled = order.status === "cancelled";

  useGSAP(
    () => {
      const fills = gsap.utils.toArray<HTMLElement>("[data-fill]");
      const n = Math.max(0, stepIndex);
      if (prefersReducedMotion()) {
        fills.forEach((el, i) => gsap.set(el, { scaleY: i < n ? 1 : 0 }));
        return;
      }
      const done = fills.slice(0, n);
      const upcoming = fills.slice(n);
      if (done.length) gsap.to(done, { scaleY: 1, duration: 0.45, stagger: 0.08, ease: "power2.out", overwrite: "auto" });
      if (upcoming.length) gsap.to(upcoming, { scaleY: 0, duration: 0.3, overwrite: "auto" });
    },
    { scope: ref, dependencies: [stepIndex] },
  );

  return (
    <section className={cn("rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6", className)} aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
        Every step, timestamped
      </h2>
      {cancelled && (
        <p role="status" className="mt-4 flex items-start gap-2 rounded-2xl border border-chili-100 bg-chili-50 px-4 py-3 text-sm text-chili-600">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">Cancelled before the kitchen started.</span> Reason: {order.cancelReason ?? "not given"}. None of the steps below will happen.
          </span>
        </p>
      )}
      <ol ref={ref} className={cn("mt-6", cancelled && "opacity-60")}>
        {orderStatusSteps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const last = i === orderStatusSteps.length - 1;
          const at = new Date(placed + i * STEP_MS);
          return (
            <li key={s.key} className="flex gap-4" aria-current={active ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500",
                    active && last ? "border-leaf-600 bg-leaf-600 text-white" : done || active ? "border-copper-500 bg-copper-500 text-cream-50" : "border-line bg-white",
                  )}
                >
                  {active && !last && <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-copper-500/40" />}
                  {done || (active && last) ? <Check className="size-3.5" strokeWidth={3} /> : <span className={cn("rounded-full", active ? "size-2 bg-cream-50" : "size-1.5 bg-line")} />}
                </span>
                {!last && (
                  <span className="relative my-1 w-0.5 flex-1 rounded-full bg-line">
                    <span data-fill className="absolute inset-0 origin-top rounded-full bg-copper-500" style={{ transform: "scaleY(0)" }} />
                  </span>
                )}
              </div>
              <div className={cn("min-w-0 flex-1", !last && "pb-6")}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("text-[15px] font-semibold", done || active ? "text-cocoa-900" : "text-muted")}>{s.label}</p>
                  <time dateTime={at.toISOString()} className={cn("shrink-0 text-[12px] font-semibold tabular-nums", done || active ? "text-cocoa-700" : "text-muted/70")}>
                    {done || active ? timeFmt.format(at) : `~${timeFmt.format(at)}`}
                  </time>
                </div>
                <p className={cn("mt-0.5 text-[13px]", done || active ? "text-muted" : "text-muted/70")}>{s.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
