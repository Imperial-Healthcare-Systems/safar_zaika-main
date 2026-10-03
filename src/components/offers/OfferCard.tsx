"use client";

import { useRef, useState } from "react";
import { Copy, Gift, Percent, Sparkles, TrainFront, Users, Truck } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { toast } from "@/stores";
import type { Offer } from "@/types";

const accents: Record<Offer["accent"], { stub: string; text: string; ring: string }> = {
  copper: { stub: "gradient-brand", text: "text-copper-700", ring: "ring-copper-500/20" },
  leaf: { stub: "bg-leaf-600", text: "text-leaf-600", ring: "ring-leaf-500/20" },
  cocoa: { stub: "bg-cocoa-900", text: "text-cocoa-800", ring: "ring-cocoa-900/15" },
  gold: { stub: "bg-gold-500", text: "text-gold-600", ring: "ring-gold-500/25" },
};

const icons: Record<Offer["type"], typeof Gift> = {
  flat: Gift,
  percent: Percent,
  "free-delivery": Truck,
  "first-order": Sparkles,
  station: TrainFront,
  bulk: Users,
};

export function OfferCard({ offer, className }: { offer: Offer; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const codeRef = useRef<HTMLSpanElement>(null);
  const a = accents[offer.accent];
  const Icon = icons[offer.type];

  const reveal = () => {
    setRevealed(true);
    if (codeRef.current && !prefersReducedMotion()) {
      gsap.fromTo(codeRef.current, { rotateX: -90, autoAlpha: 0 }, { rotateX: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.7)" });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      toast({ title: `${offer.code} copied`, description: "Apply it at checkout.", tone: "success" });
    } catch {
      toast({ title: `Use code ${offer.code}`, description: "Apply it at checkout." });
    }
  };

  return (
    <article className={cn("flex h-full overflow-hidden rounded-3xl border border-line bg-white shadow-card ring-4 ring-transparent transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <div className={cn("flex w-14 shrink-0 items-center justify-center text-cream-50 sm:w-16", a.stub)}>
        <span className="rotate-180 text-[11px] font-bold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">{offer.type === "bulk" ? "Groups" : offer.type === "station" ? "Station" : "Offer"}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn("inline-flex size-9 items-center justify-center rounded-xl bg-cream-100", a.text)}>
            <Icon className="size-4" />
          </span>
          {offer.expires && <span className="text-[11px] font-semibold text-muted max-sm:text-xs">Till {new Date(offer.expires).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-cocoa-900">{offer.title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-muted">{offer.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4" style={{ perspective: 600 }}>
          {revealed ? (
            <span ref={codeRef} className="inline-flex items-center rounded-lg border border-dashed border-copper-500 bg-copper-50 px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-copper-700">
              {offer.code}
            </span>
          ) : (
            <button type="button" onClick={reveal} className="inline-flex items-center rounded-lg border border-dashed border-cocoa-900/30 bg-cream-100 px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-cocoa-900/40 transition-colors hover:border-copper-500 hover:text-copper-700 max-lg:h-11">
              {offer.code.replace(/./g, "•")}
              <span className="ml-2 font-sans text-[11px] font-bold uppercase tracking-wider text-copper-700 max-lg:text-xs">Reveal</span>
            </button>
          )}
          <button type="button" onClick={copy} className="inline-flex size-9 items-center justify-center rounded-full text-cocoa-700 transition-colors hover:bg-cream-100 max-lg:size-11" aria-label={`Copy code ${offer.code}`}>
            <Copy className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
