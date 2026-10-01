"use client";

import Image from "next/image";
import { Check, Quote, Star } from "lucide-react";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";
import { cn, formatINR } from "@/lib/utils";
import { testimonials } from "@/data/testimonials";
import type { BulkOrderRequest } from "@/types";
import { packagePrice, type MealPackage } from "./constants";

const included = ["A dedicated coordinator on call", "Sealed individual packs, labelled", "Veg and non-veg packed separately", "Live train tracking for the whole group", "Invoice for corporate bookings"];
const t = testimonials[4];

export function BulkSidebar({ groupSize, pkg, preference, className }: { groupSize: number; pkg: MealPackage; preference: BulkOrderRequest["preference"]; className?: string }) {
  const price = packagePrice(pkg, preference);
  return (
    <aside className={cn("space-y-5", className)} aria-label="Estimate and what's included">
      <div className="rounded-3xl bg-cocoa-900 p-6 text-cream-50 shadow-lift">
        <p className="text-sm font-semibold text-gold-400">Live estimate</p>
        <p className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{price === null ? "Quoted" : <AnimatedNumber value={groupSize * price} format={formatINR} />}</p>
        <p className="mt-2 text-sm text-cream-50/70">
          {price === null ? `${groupSize} × ${pkg.name}, priced by your coordinator` : `${groupSize} × ${pkg.name} at ${formatINR(price)}/head (${preference === "non-veg" || preference === "mixed" ? "non-veg" : "veg"})`}
        </p>
        <p className="mt-4 border-t border-cream-50/10 pt-4 text-[12px] leading-relaxed text-cream-50/55">
          Indicative. Mixed groups are estimated at the non-veg rate; veg packs are billed at the veg rate. Your coordinator confirms the final menu and price before anything is charged.
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-card">
        <p className="text-sm font-semibold text-muted">What&apos;s included</p>
        <ul className="mt-4 space-y-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px] text-cocoa-800">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <figure className="rounded-3xl border border-line bg-cream-100 p-6">
        <Quote className="size-6 text-copper-300" aria-hidden />
        <blockquote className="mt-3 text-[15px] leading-relaxed text-cocoa-800">{t.quote}</blockquote>
        <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="font-semibold text-cocoa-900">{t.name}</p>
            <p className="text-[12px] text-muted">{t.route}</p>
          </div>
          <span className="inline-flex items-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("size-3.5", i < t.rating ? "fill-gold-500 text-gold-500" : "text-cream-300")} />
            ))}
          </span>
        </figcaption>
      </figure>

      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
        <Image src="/images/food/biryani-platter.jpg" alt="A festive biryani platter packed for a group" fill sizes="(max-width: 1024px) 100vw, 380px" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cocoa-900/80 to-transparent p-5 pt-12 text-cream-50">
          <p className="text-sm font-semibold">Packed by name and berth</p>
          <p className="text-[12px] text-cream-50/75">So the hand-over on the platform takes one halt, not three.</p>
        </div>
      </div>
    </aside>
  );
}
