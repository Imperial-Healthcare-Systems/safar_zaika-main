"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Hash, PackageSearch, ShieldCheck, Ticket, Timer, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PnrModule } from "@/components/pnr/PnrModule";
import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils";

const paths = [
  { key: "pnr", href: "/order?mode=pnr", icon: Ticket, title: "Order with PNR", desc: "Coach and berth come straight from your ticket — seat delivery, no typing.", accent: "bg-copper-500" },
  { key: "train", href: "/order?mode=train", icon: Hash, title: "Order with train number", desc: "No PNR yet? Pick the train and your boarding station.", accent: "bg-cocoa-800" },
  { key: "bulk", href: "/bulk-order", icon: Users, title: "Bulk order", desc: "10 to 500 meals, one coordinator, one hand-over.", accent: "bg-leaf-600" },
  { key: "track", href: "/track-order", icon: PackageSearch, title: "Track an order", desc: "Station-by-station status for an order you already placed.", accent: "bg-gold-500" },
];

const reasons = [
  { icon: Timer, t: "Exact timing", d: "We read your train's live schedule to cook against the real arrival time at your chosen station." },
  { icon: ShieldCheck, t: "Seat delivery", d: "Coach and berth let our partner walk straight to you instead of calling from the platform." },
  { icon: Ticket, t: "Nothing stored", d: "We keep only what the delivery needs. Demo build: PNR 1234567890, 2345678901, 3456789012, 4567890123 are seeded." },
];

export function OrderView() {
  const params = useSearchParams();
  const mode = params.get("mode") === "train" ? "train" : "pnr";

  return (
    <>
      <PageHeader
        title={
          <>
            Order food to <span className="text-copper-600">your seat.</span>
          </>
        }
        description="Enter your PNR or train number. We map every halt on the route, show the kitchens that can reach it in time, and deliver to your berth."
      />
      <section className="container-x -mt-6 grid gap-8 pb-20 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
        <div className="order-2 lg:order-1">
          <Reveal stagger={0.06} className="grid gap-3 sm:grid-cols-2">
            {paths.map((p) => {
              const active = (p.key === "pnr" && mode === "pnr") || (p.key === "train" && mode === "train");
              return (
                <Link
                  key={p.key}
                  href={p.href}
                  scroll={false}
                  className={cn(
                    "group flex items-start gap-4 rounded-2xl border bg-white p-4 transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-out-quart) hover:-translate-y-0.5 hover:shadow-card",
                    active ? "border-copper-500 shadow-glow" : "border-line",
                  )}
                  aria-current={active ? "true" : undefined}
                >
                  <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-cream-50", p.accent)}>
                    <p.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-semibold text-cocoa-900">
                      {p.title}
                      <ArrowRight className="size-4 text-copper-600 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted">{p.desc}</span>
                  </span>
                </Link>
              );
            })}
          </Reveal>

          <Reveal className="mt-10 rounded-3xl bg-cocoa-900 p-6 text-cream-50 sm:p-8">
            <h2 className="font-display text-2xl">Why we ask for a PNR</h2>
            <ul className="mt-5 space-y-4">
              {reasons.map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream-50/8 text-gold-400">
                    <f.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{f.t}</p>
                    <p className="text-sm text-cream-50/60">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
          <PnrModule key={mode} defaultMode={mode} />
        </div>
      </section>
    </>
  );
}
